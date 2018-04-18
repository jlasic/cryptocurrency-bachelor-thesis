const Peer2Peer = require('./peer2peer');
const Miner = require('../miner/miner');
const Wallet = require('../wallet/wallet');
const Transaction = require('../blockchain/transaction');
const Block = require('../blockchain/block');

/* 
20 000 000 000 average difficulty for 
10 second block generation time on my machine
 */

class Node{
    constructor(port = 3001, blockchain, peers = []){
        this.blockchain = blockchain;
        this.p2p = new Peer2Peer(port);
        this.wallet = new Wallet(`pw${port}`, this.blockchain);
        this.miner = new Miner(this.blockchain, this.wallet);

        peers.forEach((peer) => {
            this.connect(peer);
        });

        this.initListeners();
        this.miner.start();
    }

    initListeners(){
        const self = this;

        this.miner.on('blockFound', (block) => {
            console.log(`block ${block.index}. found:\n${block.hash}`);
            //broadcast block;
            self.p2p.broadcast('block', block);
        });

        this.p2p.on('message', (peer, message) => {
            switch(message.type){
                case 'handshake':
                self._handshake(peer,message);
                break;
                case 'blockchain':
                self._blockchain(peer,message);
                break;
                case 'block':
                self._block(peer,message);
                break;
                case 'transaction':
                self._transaction(peer, message);
                break;
            }

        });
    }

    _handshake(peer, message){
        if (message.version !== this.p2p.VERSION)
            return; //TODO: terminate connection!!;
            
        if (message.ack){ //I initiated this connection so sync the blockchains
            const message = {
                type: 'blockchain',
                blocks: this.blockchain.blocks 
            }
            this.p2p.write(peer, message);
        }
        else{ //this is an incoming connection, so acknowledge his handshake
            const response = {
                type: 'handshake',
                ack: true,
                version: this.p2p.VERSION,
                lastBlock: this.blockchain.getLastBlock()
            };
            this.p2p.write(peer, response);
        }

        console.log(`Peer connected ${peer._socket.remoteAddress}:${peer._socket.remotePort}`);
        this.p2p.peers.push(peer);
    }

    _blockchain(peer, message){
        if (message.blocks.length > this.blockchain.blocks.length){
            this.miner.stopWorker();
            let blocks = [];
            message.blocks.forEach(block => {
                blocks.push(Block.fromJSON(block));
            });
            this.blockchain.swapBlockchain(blocks);
            this.miner.start();
            console.log('swapping blockchain');
        }
        else{
            const message = {
                type: 'blockchain',
                blocks: this.blockchain.blocks 
            }
            this.p2p.write(peer, message);
            console.log('sending blockchain');
        }
    }

    _block(peer, message){
        if (this.blockchain.getLastBlock().hash === message.data.previousBlockHash){ //do all kinds of checks
            this.miner.stopWorker();
            this.blockchain.push(Block.fromJSON(message.data));
            this.miner.start();
            console.log(`block ${message.data.index}. received:\n${message.data.hash}`);
            this.p2p.broadcast('block', message.data, peer);
        }
    }

    _transaction(peer, message){
        const transaction = Transaction.fromJSON(message.data);
        if (this.blockchain.mempoolAddTransaction(transaction))
            this.p2p.broadcast('transaction', transaction, peer);
    }

    //peerSocket formatted as: localhost:3001
    connect(peerSocket){
        this.p2p.connect(peerSocket);
    }

    addTransaction(transaction){
        if (this.blockchain.mempoolAddTransaction(transaction)){
            this.p2p.broadcast('transaction', transaction);
            return true;
        }
    }
}

module.exports = Node;