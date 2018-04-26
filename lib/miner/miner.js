const EventEmiter = require('events');
const Block = require('../blockchain/block');
const child_process = require('child_process');
const Transaction = require('../blockchain/transaction');
const crypto = require('crypto');
const config = require('../config');

class Miner extends EventEmiter{
    constructor(blockchain, wallet){
        super();
        this.blockchain = blockchain;
        this.worker = null;
        this.wallet = wallet;
    }

    start(){
        this.createNextBlock();
    }

    stopWorker(){
        if (this.worker != null)
            this.worker.kill();
    }

    createNextBlock(){
        const block = new Block().after(this.blockchain.getLastBlock());
        const candidateTxs = this.blockchain.mempool.slice();

        //add few transactions to block
        while(candidateTxs.length > 0 && block.transactions.length < config.txPerBlock){
            const tx = candidateTxs.pop();
            //check if candidateTX spends the same utxos as other candidateTX
            if (this.blockchain.isUTXO(tx, [block]))
                block.addTransaction(tx);
        }
        //get all the fees
        let fees = 0;
        const blockchain = this.blockchain;
        block.transactions.forEach(transaction => {
            fees += blockchain.calculateFee(transaction);
        });

        //coinbase transaction ---------------
        const coinbaseTx = new Transaction();
        coinbaseTx.type = 'coinbase';
        coinbaseTx.inputs = [{
            height: this.blockchain.getHeight() + 1,
            extraNounce: crypto.randomBytes(32).toString('hex')
        }];
        coinbaseTx.outputs = [{
            address: this.wallet.getAddress(),
            amount: config.blockReward + fees
        }];
        coinbaseTx.digest();
        //-------------------------------------

        block.transactions.unshift(coinbaseTx);
        block.digest();
        this.proveWorkFor(block);
    }

    proveWorkFor(block){
        if (this.worker != null)
            this.worker.kill();

        const self = this;
        this.worker = child_process.fork(`${__dirname}/worker.js`, [JSON.stringify(block)]);
        this.worker.on('message', (string) => {
            const block = Block.fromJSON(JSON.parse(string));
            if (self.blockchain.push(block))
                self.emit('blockFound', block);
            self.createNextBlock();
        });
    }
}

module.exports = Miner;