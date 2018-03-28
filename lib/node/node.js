const Peer2Peer = require('./peer2peer');

class Node{
    constructor(port = 3001, blockchain, peers = []){
        this.blockchain = blockchain;
        this.p2p = new Peer2Peer(port);

        peers.forEach((peer) => {
            this.connect(peer);
        });
    }

    //peer formatted as: localhost:3001
    connect(peer){
        const arr = peer.split(':');
        this.p2p.connect(arr[0], arr[1]);
    }
}

module.exports = Node;