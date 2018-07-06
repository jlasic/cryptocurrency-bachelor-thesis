const Blockchain = require('./blockchain/blockchain');
const Node = require('./node/node');
const express = require('express');
const Transaction = require('./blockchain/transaction');
const bodyParser = require('body-parser');

/*
    start process with args:
        http_server_port
        p2p_server_port
*/

const app = express();
const blockchain = new Blockchain();
const node = new Node(process.argv[3], blockchain);

app.use(bodyParser.urlencoded({extended: false}));

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
app.post('/peer', function(req, res) {
    node.connect(req.body.peerSocket);
    res.send('connecting...');
});

//send x amount of coins to address from current wallet
app.post('/send', function(req, res) {
    const transaction = node.wallet.createTransaction(
        req.body.address,
        parseInt(req.body.amount)
    );
    res.send(JSON.stringify('Transaction added ? ' + node.addTransaction(transaction)));
});

//get available utxo for this wallet
app.get('/wallet', (req, res) => {
    res.send(JSON.stringify(node.wallet.availableOutputs));
});

app.get('/wallet/balance', (req, res) => {
    res.send(JSON.stringify(node.wallet.getBalance()));
});

app.listen(process.argv[2], function () {
    console.log('Example app listening on port ' + process.argv[2]);
});