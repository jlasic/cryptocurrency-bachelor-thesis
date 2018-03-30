const Block = require("./block");

class Blockchain{
    constructor(){
        this.blocks = [];
    }

    createBlock(data){
        const newBlock = new Block().addTransaction({data:data}).digest();
        console.log(`Block no.${newBlock.index}, ${newBlock.hash}`);
        this.blocks.push(newBlock);
    }

    push(block){
        this.blocks.push(block);
    }

    getLastBlock(){
        return this.blocks[this.blocks.length - 1];
    }

}

module.exports = Blockchain;