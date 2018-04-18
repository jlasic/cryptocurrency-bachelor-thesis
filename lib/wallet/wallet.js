const EdDSAUtil = require('../util/EdDSAUtil');
const HashUtil = require('../util/HashUtil');
const Transaction = require('../blockchain/transaction');

//move this to config or smth
const MINIMUM_FEE = 5;

class Wallet{
    constructor(password, blockchain){
        this.password = password;
        this.keyPairs = [];
        this.availableOutputs = [];
        /*
        const availableOutput = {
            outputTxId: transaction.txId,
            outputIndex: index,
            output: output
        }; 
        */

       // TODO restore previous wallet (all of the previous addresses)

        const self = this;
        blockchain.on('blockAdded', (block) => {
            self._checkAvailableOutputs(block);
        });

        blockchain.on('blockchainSwapped', (blocks) => {
            this.availableOutputs = [];
            blocks.forEach(block => {
                self._checkAvailableOutputs(block);
            });
        });
    }

    /*
        gets the address by index
        or generates a new one if not specified
    */
    getAddress(keyIndex){
        if (keyIndex !== undefined)
            return this.keyPairs[keyIndex].address;
        else
            return this._generateKeyPair().address;
    }

    getBalance(){
        return this.availableOutputs.reduce((accumulator, current) =>{
            return accumulator + parseInt(current.output.amount);
        }, 0);
    }

    /* 
        generates keypair chain that is the same for a given password
        pushes it to an array and returns it 
    */
    _generateKeyPair(){
        let keyPair;
        if (!this.keyPairs.length)   //there is no key's so create one from password
            keyPair = EdDSAUtil.keyPairFromPrivate(HashUtil.hash(this.password));
        else    //create it from the last private key
            keyPair = EdDSAUtil.keyPairFromPrivate(HashUtil.hash(this.keyPairs.slice(-1)[0].privateKey));
        
        this.keyPairs.push(keyPair);
        return keyPair;
    }

    /*
        return a public key that matches the given address
        (from current wallets key pairs)
    */
    _findPubKeyFromAddress(address){
        return this.keyPairs.find(keyPair => {
            return keyPair.address === address;
        }).publicKey;
    }

    /* 
        create transaction that sends x amount to specified address
        looks for this wallets ballance and if everything goes well it
        returns the signed transaction else undefined/false
    */
    createTransaction(destAddress, amount){
        const fundsNeeded = amount + MINIMUM_FEE;
        if (this.getBalance() < fundsNeeded){
            console.log('Insufficient funds in the wallet!');
            return;
        }
        const transaction = new Transaction();
        transaction.type = 'regular';

        // add inputs until the coin sum is greater than needed amount (+MINER FEE)
        let inputAmount = 0;
        while (inputAmount < fundsNeeded){
            const utxo = this.availableOutputs.pop();
            inputAmount += parseInt(utxo.output.amount);
            transaction.inputs.push({
                outputTxId: utxo.outputTxId,
                outputIndex: utxo.outputIndex,
                pubKey: this._findPubKeyFromAddress(utxo.output.address),
                signature: null
            });
        }
        // add output to destination address
        transaction.outputs.push({
            address: destAddress,
            amount: amount
        });

        // add change output if needed
        if (inputAmount > fundsNeeded){
            transaction.outputs.push({
                address: this.getAddress(),
                amount: inputAmount - fundsNeeded
            });
        }
        //sign transaction and return it
        return this._signTransaction(transaction);
    }

    /*
        sign given transaction, with keys from this wallet.
        if some of the inputs has pubKey that doesnt belong to me
        return undefined else a valid signed transaction
    */
    _signTransaction(transaction){
        let self = this;
        //sign every input in transaction
        let signed = transaction.inputs.every(input => {
            //find the matching key in this wallet
            let matchingKeyPair = self.keyPairs.find(keyPair => {
                return keyPair.publicKey === input.pubKey;
            });
            //if you own the key signe the input/output hash with private
            if (matchingKeyPair !== undefined){
                const hash = HashUtil.hash(
                    input.outputTxId +
                    input.outputIndex +
                    input.pubKey +
                    JSON.stringify(transaction.outputs)
                );
                input.signature = EdDSAUtil.signHash(matchingKeyPair.privateKey, hash);
                return true;
            }
            else{
                //cant sign one input so no point in continuing
                console.log(`Can't sign transaction. Missing key-pair!`);
                return false;
            }
        });
        if (signed)
            return transaction.digest();
    }

    /*
        check if available outputs changed for this
        wallet in the specified block, like if there are new spendable outputs
        or if previus outputs have been spent
        MUST be called sequentially for all block; from first block -> last
    */
    _checkAvailableOutputs(block){
        const self = this;
        block.transactions.forEach(transaction => {
            // check for new OTXOs
            transaction.outputs.forEach((output, index) => {
                self.keyPairs.forEach(keyPair => {
                    if (keyPair.address === output.address)
                        self.availableOutputs.push({
                            outputTxId: transaction.txId,
                            outputIndex: index,
                            output: output
                        });
                })
            });
            // check if some of availableOutputs have been spent
            transaction.inputs.forEach(input => {
                self.availableOutputs = self.availableOutputs.filter(utxo => {
                    if (!(utxo.outputTxId != input.outputTxId || utxo.outputIndex != input.outputIndex))
                        console.log(utxo.outputTxId, input.outputTxId, utxo.outputIndex, input.outputIndex)
                    return utxo.outputTxId != input.outputTxId || utxo.outputIndex != input.outputIndex;
                });
            });
        });
    }
}

module.exports = Wallet;