const Blockchain = require('./blockchain/blockchain');
const Node = require('./node/node');
const express = require('express');

/*
    start process with args:
        http_server_port
        p2p_server_port
*/

const app = express();
const blockchain = new Blockchain();
const node = new Node(process.argv[3], blockchain);

//display blockcahin
app.get('/blockchain', function (req, res) {
    res.send(JSON.stringify(blockchain));
});

//create block
app.get('/mine', function(req, res) {
    blockchain.createBlock(req.query['data']);
});

//connect to peer
app.get('/peer', function(req, res) {
    node.connect(req.query['peer']);
});

//add transaction to mempool
app.get('/transaction', function(req, res) {
    node.addTransaction({
        data: req.query['data']
    });
});

app.listen(process.argv[2], function () {
    console.log('Example app listening on port ' + process.argv[2]);
});