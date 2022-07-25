import { createHash } from '../utils/crypto';
import { Transaction } from './Transaction';

export class Block {
  timestamp: string;
  transactions: Transaction[];
  previousHash: string | null = '';
  hash: string = '';
  nonce: number;

  constructor(timestamp: string, transactions: Transaction[], previousHash: string | null = '') {
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = Block.calculateHash(this);
  }

  mine(difficulty: number) {
    while (this.hash.substring(0, difficulty) != Array(difficulty + 1).join('0')) {
      this.nonce++;
      this.hash = Block.calculateHash(this);
    }

    console.log(`Block is mined: ${this.hash}`);
  }

  static areAllTransactionsValid(block: Block) {
    for (const trx of block.transactions) {
      if (!Transaction.isValid(trx)) {
        return false;
      }
    }
    return true;
  }

  static calculateHash(block: Block) {
    return createHash(`${block.previousHash}${block.timestamp}${JSON.stringify(block.transactions)}${block.nonce}`);
  }
}
