const crypto = require('crypto');

class HashUtil{
    static hash(string){
        return crypto.createHash('sha256').update(string).digest('hex');
    }
}

module.exports = HashUtil;