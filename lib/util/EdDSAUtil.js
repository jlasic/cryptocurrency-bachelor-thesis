const crypto = require('crypto');
const elliptic = require('elliptic');
const EdDSA = elliptic.eddsa;
const ec = new EdDSA('ed25519');
const HashUtil = require('./HashUtil');

class EdDSAUtil{
    static generateSecret(password) {
        let secret = crypto.pbkdf2Sync(password, SALT, 10000, 512, 'sha512').toString('hex');
        console.debug(`Secret: \n${secret}`);
        return secret;
    }

    static keyPairFromPrivate(privateKey){
        let rawKeyPair = EdDSAUtil.rawKeyPairFromPrivate(privateKey);
        return {
            privateKey: EdDSAUtil.toHex(rawKeyPair.getSecret()),
            publicKey: EdDSAUtil.toHex(rawKeyPair.getPublic()),
        };
    }

    static rawKeyPairFromPrivate(privateKey) {
        // Create key pair from private
        let keyPair = ec.keyFromSecret(privateKey); // hex string, array or Buffer        
        console.debug(`Public key: \n${elliptic.utils.toHex(keyPair.getPublic())}`);
        return keyPair;
    }

    static signHash(privateKey, messageHash) {
        let keyPair = rawKeyPairFromPrivate(privateKey);
        let signature = keyPair.sign(messageHash).toHex().toLowerCase();
        console.debug(`Signature: \n${signature}`);
        return signature;
    }

    static verifySignature(publicKey, signature, messageHash) {
        let key = ec.keyFromPublic(publicKey, 'hex');
        let verified = key.verify(messageHash, signature);
        console.debug(`Verified: ${verified}`);
        return verified;
    }

    static toHex(data) {
        return elliptic.utils.toHex(data);
    }
}
    
module.exports = EdDSAUtil;