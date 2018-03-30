const Peer2Peer = require('./peer2peer');

/* 
20 000 000 000 average difficulty for 
10 second block generation time on my machine
 */

class Node{
    constructor(port = 3001, blockchain, peers = []){
        this.blockchain = blockchain;
        this.p2p = new Peer2Peer(port);

        this.blockchain.createBlock("GENESIS");
        peers.forEach((peer) => {
            this.connect(peer);
        });
    }

    //peerSocket formatted as: localhost:3001
    connect(peerSocket){
        this.p2p.connect(peerSocket);
    }
}

module.exports = Node;