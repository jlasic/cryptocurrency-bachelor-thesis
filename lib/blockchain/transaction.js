const crypto = require('crypto');

class Transaction{
    constructor(){
        this.type = 'regular';
        this.txId = null;
        this.inputs = [];
        this.outputs = [];

        /* let input = {
            txId: "inputTxId",
            UTXO: "unspentTransactionOutput",
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

    digest(){
        this.txId = crypto.createHash('sha256')
            .update(JSON.stringify(this.inputs))
            .update(JSON.stringify(this.outputs))
            .digest('hex');
        return this;
    }
}

module.exports = Transaction;