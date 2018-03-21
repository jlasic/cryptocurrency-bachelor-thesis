const Blockchain = require('./blockchain/blockchain');

// Require express and create an instance of it
var express = require('express');
var app = express();
let blockchain = new Blockchain();

// on the request to root (localhost:3000/)
app.get('/blockchain', function (req, res) {
    res.send(JSON.stringify(blockchain));
});

app.get('/mine', function(req, res) {
    blockchain.createBlock(req.query['data']);
});

// start the server in the port 3000 !
app.listen(80, function () {
    console.log('Example app listening on port 80.');
});