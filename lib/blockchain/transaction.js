class Transaction{
    constructor(){
        this.type = 'regular';
        this.txId = 0;
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
}

module.exports = Transaction;