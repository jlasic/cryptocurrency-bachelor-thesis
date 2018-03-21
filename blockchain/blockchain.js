const Block = require("./block");

class Blockchain{
    constructor(){
        this.blocks = [new Block('GENESIS', null)];
    }

    createBlock(data){
        console.log("Mining block no." + this.blocks.length);

        let newBlock = new Block(data, this.lastBLock().toHash());
        this.blocks.push(newBlock);
    }

    lastBLock(){
        return this.blocks[this.blocks.length - 1];
    }

}

module.exports = Blockchain;