const EventEmiter = require('events');
const Block = require('../blockchain/block');
const child_process = require('child_process');
const Transaction = require('../blockchain/transaction');
const crypto = require('crypto');

class Miner extends EventEmiter{
    constructor(blockchain, wallet){
        super();
        this.blockchain = blockchain;
        this.mempool = [];
        this.worker = null;
        this.wallet = wallet;
    }

    start(){
        this.createNextBlock();
    }

    addTransaction(transaction){
        this.mempool.push(transaction);
    }

    createNextBlock(){
        //coinbase transaction ---------------
        const coinbaseTx = new Transaction();
        coinbaseTx.type = 'coinbase';
        coinbaseTx.inputs = [{
            height: this.blockchain.getHeight() + 1,
            extraNounce: crypto.randomBytes(32).toString('hex')
        }];
        coinbaseTx.outputs = [{
            pubKeyHash: this.wallet.getAddress(0),
            //collect miner fee from the block as well!!
            amount: 1000
        }];
        coinbaseTx.digest();
        //-------------------------------------

        const block = new Block() 
                        .after(this.blockchain.getLastBlock())
                        .addTransaction(coinbaseTx)
                        .addTransaction(this.mempool.pop())
                        .digest();
        this.proveWorkFor(block);
    }

    proveWorkFor(block){
        if (this.worker != null)
            this.worker.kill();

        const self = this;
        this.worker = child_process.fork(`${__dirname}/worker.js`, [JSON.stringify(block)]);
        this.worker.on('message', (string) => {
            const block = Block.fromJSON(JSON.parse(string));
            self.blockchain.push(block);
            self.emit('blockFound', block);
            self.createNextBlock();
        });
    }
}

module.exports = Miner;