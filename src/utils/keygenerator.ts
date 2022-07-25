import { ec as EC } from 'elliptic';
import fs from 'fs';
const ec = new EC('secp256k1');
export const keyPair = ec.genKeyPair();

const publicKey = keyPair.getPublic('hex');
const privateKey = keyPair.getPrivate('hex');

const keyPairString = `Your public key: ${publicKey}\n\nYour private key: ${privateKey}`;

fs.writeFileSync(`${__dirname}/keys.txt`, keyPairString);

console.log(keyPairString);
