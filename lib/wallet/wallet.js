const EdDSAUtil = require('../util/EdDSAUtil');
const HashUtil = require('../util/HashUtil');

class Wallet{
    constructor(password){
        this.password = password;
        //this.keyPairs = [];

        //move key generation somwhere else
        this.keyPairs = [
            EdDSAUtil.keyPairFromPrivate(HashUtil.hash(this.password))
        ];
    }

    getAddress(keyIndex){
        return HashUtil.hash(this.keyPairs[keyIndex].publicKey);
    }
}

module.exports = Wallet;