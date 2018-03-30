const EventEmiter = require('events');
const Block = require('../blockchain/block');
const child_process = require('child_process');

class Miner extends EventEmiter{
    constructor(blockchain){
        super();
        this.blockchain = blockchain;
        this.mempool = [];
        this.worker = null;
    }

    start(){
        this.createNextBlock();
    }

    addTransaction(transaction){
        this.mempool.push(transaction);
    }

    createNextBlock(){
        const block = new Block() 
                        .after(this.blockchain.getLastBlock())
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