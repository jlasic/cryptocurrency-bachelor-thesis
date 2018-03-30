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
    }

    addTransaction(transaction){
        this.transactions.push(transaction);
        return this;
    }

    digest(){
        this.timestamp = Date.now();
        this.transactionsHash = crypto.createHash('sha256').update(JSON.stringify(this.transactions)).digest('hex');
        this.hash = Block.toHash(this);
        return this;
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