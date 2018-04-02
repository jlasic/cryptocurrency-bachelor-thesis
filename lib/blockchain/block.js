const crypto = require('crypto');

class Block{
    constructor(){
        this.index = 0;
        this.timestamp = 0;
        this.nounce = 0;
        this.previousBlockHash = 0;
        this.transactionsHash = 0;
        this.transactions = [];
        this.hash = 0;
    }

    after(block){
        this.index = block.index + 1;
        this.previousBlockHash = block.hash;
        return this;
    }

    withTransactions(transactions){
        transactions.forEach(transaction => {
            this.addTransaction(transaction);
        });
        return this;
    }

    addTransaction(transaction){
        if (transaction != null)
            this.transactions.push(transaction);
        return this;
    }

    digest(){
        this.timestamp = Date.now();
        this.transactionsHash = crypto.createHash('sha256').update(JSON.stringify(this.transactions)).digest('hex');
        this.hash = this.toHash();
        return this;
    }
    
    static fromJSON(object){
        const block = new Block();
        for (const key in object) {
            if (key == 'transactions'){
                //CHANGE THIS WHEN YOU ADD TRANSACTION CLASS
                block[key] = object[key];
            }
            else
                block[key] = object[key];
        }
        return block;
    }

    getDifficulty(){
        return Block.getDifficulty(this);
    }

    static getDifficulty(block){
        return parseInt(block.hash.substring(0,14),16);
    }

    toHash(){
        return Block.toHash(this);
    }

    static toHash(block){
        const blockHeader = 
                "" + 
                block.index + 
                block.timestamp + 
                block.nounce + 
                block.previousBlockHash + 
                block.transactionsHash;
        return crypto.createHash('sha256').update(blockHeader).digest('hex');
    }
}

module.exports = Block;