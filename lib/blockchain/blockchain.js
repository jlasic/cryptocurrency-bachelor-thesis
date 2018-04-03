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
        return this.blocks.length - 1;
    }

    //get output in blockchain that is identified by outputIndex in outputTxId's outputs array
    getOutput(outputTxId, outputIndex, blocks = this.blocks){
        for (let i = 0; i<blocks.length; i++){
            let block = blocks[i];
            let tx = block.transactions.find(transaction => {
                return transaction.txId === outputTxId && outputIndex < transaction.outputs.length;
            });

            if (tx !== undefined)
                return tx.outputs[outputIndex];
        }
        //if you dont find (return) the output in for loop, it doesnt exist in the blockchain
        console.log(`Transaction output: ${outputTxId}[${outputIndex}] doesnt exist`);
    }

    //check if specified output is spent (found in some other tx's input) in supplied blocks (blockchain by default)
    isUTXO(outputTxId, outputIndex, blocks = this.blocks){
        return blocks.every(block => {
            return block.transactions.every(transaction => {
                return transaction.inputs.every(input => {
                    return input.outputTxId !== outputTxId || input.outputIndex !== outputIndex;
                });
            });
        });
    }

}

module.exports = Blockchain;