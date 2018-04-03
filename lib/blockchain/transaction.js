const EdDSAUtil = require('../util/EdDSAUtil');
const HashUtil = require('../util/HashUtil');

class Transaction{
    constructor(){
        this.type = 'regular';
        this.txId = null;
        this.inputs = [];
        this.outputs = [];

        /* let input = {
            outputTxId: "transactionId from where UTXO comes from",
            outputIndex: "index of the output in that transaction",
            pubKey: "pubKey",
            //sign outputs with private key
            signature: "sign"
        };
        let output = {
            //destination pub key hash
            pubKeyHash: "pubKeyHash",
            amount: "amount"
        }; */
    }

    //check if transaction has been tempered with (MUST BE FALSE)
    static wasTempered(transaction){
        if (transaction.txId !== Transaction.toHash(transaction)){
            console.log(`Invalid transaction id (hash): ${transaction.txId}`);
            return true;
        }

        //check if input/output data chenged
        return !transaction.inputs.every(txInput => {
            const hash = HashUtil.hash(
                txInput.outputTxId +
                txInput.outputIndex +
                txInput.pubKey +
                JSON.stringify(transaction.outputs)
            );
            let verified = EdDSAUtil.verifySignature(txInput.pubKey, txInput.signature, hash);
            if (!verified)
                console.log(`Invalid signature for UTXO: ${transaction.outputTxId}[${transaction.outputIndex}]`);
            return verified;
        });
    }

    digest(){
        this.txId = Transaction.toHash(this);
        return this;
    }

    static toHash(transaction){
        return HashUtil.hash(JSON.stringify(transaction.inputs) + JSON.stringify(transaction.outputs));
    }
}

module.exports = Transaction;