const EventEmiter = require('events');
const Block = require('./block');
const Transaction = require('./transaction');
const HashUtil = require('../util/HashUtil');

class Blockchain extends EventEmiter{
    constructor(){
        super();
        this.blocks = [this.genesisBlock()];
        this.mempool = [];

        this.initListeners();
    }

    initListeners(){
        const self = this;
        this.on('blockAdded', (block) => {
            self.mempool = self.mempool.filter((transaction, index) => {
                //remove transactions from the mempool that had some of their inputs 
                //spent in the last block
                return transaction.inputs.every(input => {
                    return self.isUTXO(input.outputTxId, input.outputIndex, [block]);
                });
            });
        });
    }

    genesisBlock(){
        const genesis = new Block();
        genesis.hash = genesis.toHash();
        return genesis;
    }

    swapBlockchain(blocks){
        this.blocks = blocks;
        this.emit('blockchainSwapped', blocks);
    }

    push(block){
        this.blocks.push(block);
        this.emit('blockAdded', block);
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

    validateTransaction(transaction, blocks = this.blocks){
        if (Transaction.verifyTransaction(transaction)){
            let inputSum = 0;
            let outputSum = 0;

            const self = this;
            const inputsValid = transaction.inputs.every(input => {
                let txo = self.getOutput(input.outputTxId, input.outputIndex, blocks);
                if (txo && txo.address === HashUtil.hash(input.pubKey) && self.isUTXO(input.outputTxId, input.outputIndex, blocks)){
                    inputSum += parseInt(txo.amount);
                    return true;
                }
            });
            
            transaction.outputs.forEach(output => {
                outputSum += parseInt(output.amount);
            });
            
            return inputsValid && inputSum > outputSum;
        }
        return false;
    }

    mempoolAddTransaction(transaction){
        if (this.validateTransaction(transaction)){
            const stringifiedTx = JSON.stringify(transaction);
            const notInMempool = this.mempool.every(mempoolTx => {
                return JSON.stringify(mempoolTx) !== stringifiedTx;
            });

            if (notInMempool){
                this.mempool.push(transaction);
                console.log(`Added transaction to mempool:\n${transaction.txId}`);
                return true;
            }
        }
        return false;
    }

}

module.exports = Blockchain;