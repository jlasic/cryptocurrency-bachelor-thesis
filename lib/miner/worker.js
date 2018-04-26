const Block = require('../blockchain/block');
const config = require('../config');

let blockObj = JSON.parse(process.argv[2]);

while(Block.getDifficulty(blockObj) > config.difficulty){
    blockObj.nounce++;
    blockObj.timestamp = Date.now();
    blockObj.hash = Block.toHash(blockObj);
}

process.send(JSON.stringify(blockObj));