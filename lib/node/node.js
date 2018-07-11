const Peer2Peer = require('./peer2peer');
const Miner = require('../miner/miner');
const Wallet = require('../wallet/wallet');
const Transaction = require('../blockchain/transaction');
const Block = require('../blockchain/block');
const config = require('../config');
const Blockchain = require('../blockchain/blockchain');

/* 
20 000 000 000 average difficulty for 
10 second block generation time on my machine
 */

class Node{
    constructor({port, blockchain, peers = [], miner} = {}){
        this.blockchain = blockchain;
        this.miner = miner;
        this.p2p = new Peer2Peer(port);
        
        peers.forEach((peer) => {
            this.connect(peer);
        });

        this.initListeners();
        this.miner.start();
    }

    initListeners(){
        this.miner.on('blockFound', function broadcast(block){
            console.log(`block ${block.index}. found:\n${block.hash}`);
            //broadcast block;
            this.p2p.broadcast('block', block);
        }.bind(this));

        this.p2p.on('message', function handle(peer, message){
            switch(message.type){
                case 'handshake':
                this._handshake(peer,message);
                break;
                case 'blockchain':
                this._blockchain(peer,message);
                break;
                case 'block':
                this._block(peer,message);
                break;
                case 'transaction':
                this._transaction(peer, message);
                break;
            }
        }.bind(this));
    }

    _handshake(peer, message){
        if (message.version !== config.version)
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
                version: config.version,
                lastBlock: this.blockchain.getLastBlock()
            };
            this.p2p.write(peer, response);
        }

        console.log(`Peer connected ${peer._socket.remoteAddress}:${peer._socket.remotePort}`);
        this.p2p.peers.push(peer);
    }

    _blockchain(peer, message){
        const blocks = Blockchain.blocksFromJSON(message.blocks);
        if (blocks && blocks.length > this.blockchain.blocks.length){
            this.miner.stopWorker();
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
        const block = Block.fromJSON(message.data);

        if (this.blockchain.validateBlock(block)){ //do all kinds of checks
            this.miner.stopWorker();
            this.blockchain.push(block);
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
    connect(peerSocket, callback){
        this.p2p.connect(peerSocket, callback);
    }

    addTransaction(transaction){
        if (this.blockchain.mempoolAddTransaction(transaction)){
            this.p2p.broadcast('transaction', transaction);
            return true;
        }
    }
}

module.exports = Node;