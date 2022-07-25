import { createHash } from '../utils/crypto';

import { ec as EC } from 'elliptic';
const ec = new EC('secp256k1');

export class Transaction {
  signature: string = '';

  constructor(readonly from: string | null, readonly to: string, readonly amount: number) {}

  sign(signingKey: EC.KeyPair) {
    if (signingKey.getPublic('hex') !== this.from) {
      throw new Error('You cannot sign this transaction');
    }
    const txHash = Transaction.calculateHash(this);
    const signature = signingKey.sign(txHash, 'base64');
    this.signature = signature.toDER('hex');
  }

  static calculateHash(trx: Transaction) {
    return createHash(`${trx.from}${trx.to}${trx.amount}`);
  }

  static isValid(trx: Transaction): boolean {
    // mining reward
    if (trx.from === null) {
      return true;
    }

    if (!trx.signature || trx.signature.length === 0) {
      return false;
    }

    const publicKey = ec.keyFromPublic(trx.from, 'hex');
    return publicKey.verify(Transaction.calculateHash(trx), trx.signature);
  }
}
