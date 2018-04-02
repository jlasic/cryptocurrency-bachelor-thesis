const EdDSAUtil = require('../util/EdDSAUtil');
const crypto = require('crypto');

class Wallet{
    constructor(password){
        this.password = password;
        //this.keyPairs = [];

        //move key generation somwhere else
        const rawKeyPair = EdDSAUtil.generateKeyPairFromSecret(
            crypto.createHash('sha256').update(this.password).digest('hex')
        );
        this.keyPair = {
            publicKey: EdDSAUtil.toHex(rawKeyPair.getPublic()),
            secretKey: EdDSAUtil.toHex(rawKeyPair.getSecret())
        }
        console.log(`pub:${this.keyPair.publicKey}, secret:${this.keyPair.secretKey}`);
    }

    getAddress(){
        return crypto.createHash('sha256').update(this.keyPair.publicKey).digest('hex');
    }
}

module.exports = Wallet;