const EventEmiter = require('events');
const Block = require('./block');
const Transaction = require('./transaction');
const HashUtil = require('../util/HashUtil');
const config = require('../config');

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
        if (this.validateBlock(block)){
            this.blocks.push(block);
            this.emit('blockAdded', block);
            return true;
        }
        else
            console.log(`Block invalid \n${block.hash}`);
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

    /* 
        validate regular transaction
    */
    validateTransaction(transaction, blocks = this.blocks){
        if (!Transaction.verifyTransaction(transaction))
            return false;

        if (transaction.type == 'regular'){
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
            
            return inputsValid && inputSum >= outputSum + config.minimumFee;
        }
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

    /* 
        for block to be valid all the transactions in it have to be valid
        and have only one coinbase transaction at index == 0
    */
    validateBlock(block, blocks = this.blocks){
        const previousBlock =  blocks.slice(-1).pop();
        if (block.verify() && block.getDifficulty() <= config.difficulty && block.previousBlockHash === previousBlock.hash){
            const self = this;

            //check if regular transacions are valid (index > 0), dont check coinbase
            const regularTransactions = block.transactions.slice(1);
            const regularCondition = regularTransactions.every((transaction) => {
                return self.validateTransaction(transaction, blocks);
            });
            //if some transaction is not valid return
            if (!regularCondition)
                return false;

            //check if coinbase transaction is valid (outputs dont exceeds reward + fees from other txs)
            let coinbaseOutputAmount = 0;
            block.transactions[0].outputs.forEach(output => {
                coinbaseOutputAmount += output.amount;
            });
            //get all miner fees
            let fees = 0;
            regularTransactions.forEach(transaction => {
                fees += self.calculateFee(transaction, blocks);
            });

            return coinbaseOutputAmount <= fees + config.blockReward;
        }
    }

    /*
        calculate transaction miner fee,
        transaction spends funds from specified blockchain
    */
    calculateFee(transaction, blocks = this.blocks){
        let outputAmount = 0;
        transaction.outputs.forEach(output => {
            outputAmount += output.amount;
        });

        let inputAmount = 0;
        const self = this;
        transaction.inputs.forEach(input => {
            const utxo = self.getOutput(input.outputTxId, input.outputIndex, blocks);
            inputAmount += utxo.amount;
        });

        return inputAmount - outputAmount;
    }
}

module.exports = Blockchain;