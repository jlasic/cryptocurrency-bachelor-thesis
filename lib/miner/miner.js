const EventEmiter = require('events');
const Block = require('../blockchain/block');

class Miner extends EventEmiter{
    constructor(blockchain){
        super();
        this.blockchain = blockchain;
        this.mempool = [];
    }

    start(){
        this.mineNextBlock();
    }

    addTransaction(transaction){
        this.mempool.push(transaction);
    }

    mineNextBlock(){
        const block = new Block() 
                        .after(this.blockchain.getLastBlock())
                        .addTransaction(this.mempool.pop())
                        .digest();
        this.proveWorkFor(block);
    }

    proveWorkFor(block){
        const timeStart = Date.now();
        const difficulty = 20000000000;
        while(block.getDifficulty() > difficulty){
            block.incrementNounce();
        }
        this.blockchain.push(block);
        console.log("time took: " + (Date.now() - timeStart)/1000);
        this.emit('blockFound', block);
        this.mineNextBlock();
    }
}

module.exports = Miner;