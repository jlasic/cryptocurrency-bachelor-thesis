const Peer2Peer = require('./peer2peer');
const Miner = require('../miner/miner');
const Wallet = require('../wallet/wallet');

/* 
20 000 000 000 average difficulty for 
10 second block generation time on my machine
 */

class Node{
    constructor(port = 3001, blockchain, peers = []){
        this.blockchain = blockchain;
        this.p2p = new Peer2Peer(port);
        this.miner = new Miner(blockchain, new Wallet('jaaa'));

        peers.forEach((peer) => {
            this.connect(peer);
        });

        this.initListeners();
        this.miner.start();
    }

    initListeners(){
        const self = this;
        this.miner.on('blockFound', (block) => {
            console.log("block found: " + JSON.stringify(block));
            //broadcast block;
        });
        this.p2p.on('peerConnected', (peer) => {

            //broadcast peer;
        })
    }

    //peerSocket formatted as: localhost:3001
    connect(peerSocket){
        this.p2p.connect(peerSocket);
    }

    addTransaction(transaction){
        //checkTransaction();
        this.miner.mempool.push(transaction);
    }
}

module.exports = Node;