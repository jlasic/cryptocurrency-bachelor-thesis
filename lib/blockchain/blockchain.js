const Block = require("./block");

class Blockchain{
    constructor(){
        this.blocks = [this.genesisBlock()];
    }

    genesisBlock(){
        const genesis = new Block();
        genesis.hash = genesis.toHash();
        return genesis;
    }

    push(block){
        this.blocks.push(block);
    }

    getLastBlock(){
        return this.blocks[this.blocks.length - 1];
    }

    getHeight(){
        return this.blocks.length;
    }

}

module.exports = Blockchain;