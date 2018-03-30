const Block = require('../blockchain/block');
//TODO: move difficulty to config
const difficulty = 20000000000;

let blockObj = JSON.parse(process.argv[2]);

while(Block.getDifficulty(blockObj) > difficulty){
    blockObj.nounce++;
    blockObj.timestamp = Date.now();
    blockObj.hash = Block.toHash(blockObj);
}

process.send(JSON.stringify(blockObj));