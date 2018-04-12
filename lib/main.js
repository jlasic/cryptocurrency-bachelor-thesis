const Blockchain = require('./blockchain/blockchain');
const Node = require('./node/node');
const express = require('express');
const Transaction = require('./blockchain/transaction');

/*
    start process with args:
        http_server_port
        p2p_server_port
*/

const app = express();
const blockchain = new Blockchain();
const node = new Node(process.argv[3], blockchain);

//display output data
app.get('/output', function (req, res) {
    res.send(JSON.stringify(blockchain.getOutput(req.query['txId'], req.query['index'])));
});

//check if output is spendable
app.get('/utxo', function (req, res) {
    res.send(JSON.stringify(blockchain.isUTXO(req.query['txId'], req.query['index'])));
});

//display blockcahin
app.get('/blockchain', function (req, res) {
    res.send(JSON.stringify(blockchain.blocks));
});

//connect to peer
app.get('/peer', function(req, res) {
    node.connect(req.query['peer']);
});

//add transaction to mempool
app.get('/transaction', function(req, res) {
    //transaction builder------------
    const transaction = new Transaction();
    transaction.type = 'regular';
    transaction.inputs = [{
        outputTxId: req.query['txId'],
        outputIndex: req.query['index'],
        pubKey: req.query['pubKey'],
        signature: null
    }];
    transaction.outputs = [{
        pubKeyHash: "pubKeyHash",
        amount: 50
    }];
    //-------------------------------
    node.wallet.signTransaction(transaction);
    res.send(JSON.stringify('Transaction added ? ' + node.addTransaction(transaction)));
});

app.listen(process.argv[2], function () {
    console.log('Example app listening on port ' + process.argv[2]);
});