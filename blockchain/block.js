const crypto = require('crypto');

class Block{
    constructor(data, previousBlockHash){
        this.data = data;
        this.previousBlockHash = previousBlockHash;
        console.log("Created new block: " + this.toHash());
    }
    toHash(){
        return crypto.createHash('sha256').update(JSON.stringify(this)).digest('hex');
    }
}

module.exports = Block;