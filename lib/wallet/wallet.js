const EdDSAUtil = require('../util/EdDSAUtil');
const HashUtil = require('../util/HashUtil');

class Wallet{
    constructor(password){
        this.password = password;
        //this.keyPairs = [];

        //move key generation somwhere else
        const rawKeyPair = EdDSAUtil.generateKeyPairFromSecret(
            HashUtil.hash(this.password)
        );
        this.keyPair = {
            publicKey: EdDSAUtil.toHex(rawKeyPair.getPublic()),
            secretKey: EdDSAUtil.toHex(rawKeyPair.getSecret())
        }
        console.log(`pub:${this.keyPair.publicKey}, secret:${this.keyPair.secretKey}`);
    }

    getAddress(){
        return HashUtil.hash(this.keyPair.publicKey);
    }
}

module.exports = Wallet;