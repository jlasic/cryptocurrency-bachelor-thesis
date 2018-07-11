const Blockchain = require('./blockchain/blockchain');
const Node = require('./node/node');
const express = require('express');
const bodyParser = require('body-parser');
const Wallet = require ('./wallet/wallet');
const Miner = require('./miner/miner');

/*
    start process with args:
        http_server_port
        p2p_server_port
*/
const http_server_port = process.argv[2];
const p2p_server_port = process.argv[3];

const app = express();
const blockchain = new Blockchain();
const wallet = new Wallet(`pw${p2p_server_port}`, blockchain);
const miner = new Miner(blockchain,wallet);
const node = new Node({port: p2p_server_port, blockchain, miner});

app.use(bodyParser.urlencoded({extended: false}));

//display output data
app.get('/output', function (req, res) {
    res.json(blockchain.getOutput(req.query['txId'], req.query['index']));
});

//check if output is spendable
app.get('/utxo', function (req, res) {
    res.json(blockchain.isUTXO(req.query['txId'], req.query['index']));
});

//display blockcahin
app.get('/blockchain', function (req, res) {
    res.json(blockchain.blocks);
});

//connect to peer
app.post('/peer', function(req, res) {
    node.connect(req.body.peerSocket, (message) => {res.send(message)});
});

//send x amount of coins to address from current wallet
app.post('/send', function(req, res) {
    const transaction = wallet.createTransaction(
        req.body.address,
        parseInt(req.body.amount)
    );
    res.json(node.addTransaction(transaction));
});

//get available utxo for this wallet
app.get('/wallet', (req, res) => {
    res.json(wallet.availableOutputs);
});

app.get('/wallet/balance', (req, res) => {
    res.json(wallet.getBalance());
});

app.listen(http_server_port, function () {
    console.log('Example app listening on port ' + http_server_port);
});