const EdDSAUtil = require('../util/EdDSAUtil');
const HashUtil = require('../util/HashUtil');
const Transaction = require('../blockchain/transaction');

class Wallet{
    constructor(password){
        this.password = password;
        //this.keyPairs = [];

        //move key generation somwhere else
        this.keyPairs = [
            EdDSAUtil.keyPairFromPrivate(HashUtil.hash(this.password))
        ];
    }

    getAddress(keyIndex){
        return HashUtil.hash(this.keyPairs[keyIndex].publicKey);
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