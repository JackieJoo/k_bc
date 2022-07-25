import { Block } from './Block';
import { Transaction } from './Transaction';

export class Blockchain {
  chain: Array<Block>;
  pendingTransactions: Transaction[];
  miningReward: number;
  difficulty: number;
  blockMaxCapacity: number = 10;

  constructor(difficulty: number = 4, miningReward: number = 100) {
    this.chain = [Blockchain._createGenesisBlock()];
    this.difficulty = difficulty;
    this.miningReward = miningReward;
    this.pendingTransactions = [];
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  get size() {
    return this.chain.length;
  }

  minePendingTransactions(minerAddress: string) {
    const rewardTx = new Transaction(null, minerAddress, this.miningReward);
    this.pendingTransactions.push(rewardTx);

    for (let i = 0; i <= this.pendingTransactions.length; i += this.blockMaxCapacity) {
      const nextEndIndex = i + this.blockMaxCapacity;
      const realEndIndex =
        nextEndIndex > this.pendingTransactions.length ? this.pendingTransactions.length : nextEndIndex;
      const trxs = this.pendingTransactions.slice(i, realEndIndex);
      const block = new Block(new Date().toISOString(), trxs, this.getLatestBlock().hash);
      block.mine(this.difficulty);

      // Check hashes again to make sure we didn't add a new block from other node, while were mining this one
      if (block.previousHash === this.getLatestBlock().hash) {
        this.chain.push(Object.freeze(block));
      }
    }
    this.pendingTransactions = [];
  }

  addTransaction(trx: Transaction) {
    if (!trx.from || !trx.to) {
      throw new Error('Transaction must have `from` and `to` addresses');
    }

    if (!Transaction.isValid(trx)) {
      throw new Error('Transaction must be valid');
    }

    if (trx.amount < 0) {
      throw new Error('Transaction amount must be higher than 0');
    }

    const walletBalance = this.getBalanceOfAddress(trx.from);
    if (walletBalance < trx.amount) {
      throw new Error("You don't have enough funds to make this transaction");
    }

    // if wallet has other pending trx, check that it has funds for all of them
    const pendingTrxForWallet = this.pendingTransactions.filter((pendingTrx) => pendingTrx.from === trx.from);

    if (pendingTrxForWallet.length > 0) {
      const pendingAmount = pendingTrxForWallet.reduce((prev, curr) => {
        return prev + curr.amount;
      }, 0);
      const totalAmount = pendingAmount + trx.amount;
      if (totalAmount > walletBalance) {
        throw new Error('Wallet balance is lower than overall pending transactions amount');
      }
    }

    this.pendingTransactions.push(trx);
  }

  getBalanceOfAddress(address: string) {
    let balance = 0;

    for (const block of this.chain) {
      for (const trx of block.transactions) {
        if (trx.from === address) {
          balance -= trx.amount;
        }
        if (trx.to === address) {
          balance += trx.amount;
        }
      }
    }

    return balance;
  }

  static isChainValid(chain: Block[]) {
    for (let i = 1; i < chain.length; i++) {
      const currentBlock = chain[i];
      const previousBlock = chain[i - 1];

      if (
        currentBlock.previousHash !== previousBlock.hash ||
        currentBlock.hash !== Block.calculateHash(currentBlock) ||
        !Block.areAllTransactionsValid(currentBlock)
      ) {
        return false;
      }
    }

    return true;
  }

  static _createGenesisBlock() {
    return new Block(new Date().toISOString(), [], null);
  }
}
