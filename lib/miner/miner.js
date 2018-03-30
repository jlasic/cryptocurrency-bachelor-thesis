const EventEmiter = require('events');

class Miner extends EventEmiter{
    constructor(blockchain){
        super();
        this.blockchain = blockchain;
    }

    mine(){
        const self = this;
        setTimeout(function(){
            self.emit('update');
            self.mine();
        }, 1000);
    }
}

module.exports = Miner;