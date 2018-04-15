const EdDSAUtil = require('../util/EdDSAUtil');
const HashUtil = require('../util/HashUtil');
const Transaction = require('../blockchain/transaction');

class Wallet{
    constructor(password, blockchain){
        this.password = password;
        this.availableOutputs = [];
        /*
        const availableOutput = {
            outputTxId: transaction.txId,
            outputIndex: index,
            output: output
        }; 
        */

        //move key generation somwhere else
        this.keyPairs = [
            EdDSAUtil.keyPairFromPrivate(HashUtil.hash(this.password))
        ];

        console.log(`Public Key: ${this.keyPairs[0].publicKey}`);

        const self = this;
        blockchain.on('blockAdded', (block) => {
            //check if it cointains spendable transaction outputs for this wallet;
            //or if some prev output is no longer UTXO
            block.transactions.forEach(transaction => {
                //check for new OTXOs
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
                //check if availableOutputs are not available anymore
                transaction.inputs.forEach(input => {
                    self.availableOutputs = self.availableOutputs.filter(utxo => {
                        return utxo.outputTxId != input.outputTxId || utxo.outputIndex != input.outputIndex;
                    });
                });
            });
        });
        blockchain.on('blockchainSwapped', () =>{
            this.availableOutputs = [];
            //TODO scan the blockcahin for available outputs:
        });
    }

    getAddress(keyIndex){
        return HashUtil.hash(this.keyPairs[keyIndex].publicKey);
    }

    getBalance(){
        return this.availableOutputs.reduce((accumulator, current) =>{
            return accumulator + parseInt(current.output.amount);
        }, 0);
    }

    signTransaction(transaction){
        let self = this;

        //sign every input in transaction
        transaction.inputs.every(input => {
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
        transaction.digest();
    }
}

module.exports = Wallet;