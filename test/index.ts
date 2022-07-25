// import Block from './Block';
// import { Blockchain } from '../src/blockchain/Blockchain';
// import { Transaction } from '../src/blockchain/Transaction';
// import { ec as EC } from 'elliptic';
// export const ec = new EC('secp256k1');

// const myKey = ec.keyFromPrivate('7497bd886f716e8cb3e2f3a8d84bbecfb218f685565ecc10c13a526e26b29dc7');
// const myWalletAddress = myKey.getPublic('hex');

// const blockchain = new Blockchain(4, 100);
// const tx1 = new Transaction(myWalletAddress, 'someone_public_key', 10);
// tx1.sign(myKey);
// blockchain.addTransaction(tx1);

// console.log('Starting a miner...');
// blockchain.minePendingTransactions(myWalletAddress);
// blockchain.minePendingTransactions(myWalletAddress);
// blockchain.minePendingTransactions(myWalletAddress);
// blockchain.minePendingTransactions(myWalletAddress);
// console.log('Balance of miner is', blockchain.getBalanceOfAddress(myWalletAddress));
// console.log(JSON.stringify(blockchain, null, 2));
// console.log('is blockchain valid:', Blockchain.isChainValid(blockchain.chain));
// console.log('Size:', blockchain.size);

// console.log('mining block 1');
// blockchain.addBlock(new Block(1, new Date('01/01/2001').toISOString(), { amount: 1 }));
// console.log('mining block 2');
// blockchain.addBlock(new Block(2, new Date('02/02/2002').toISOString(), { amount: 2 }));
// console.log('mining block 3');
// blockchain.addBlock(new Block(3, new Date('03/03/2003').toISOString(), { amount: 3 }));

// console.log(JSON.stringify(blockchain, null, 2));

// blockchain.chain[1].hash = 'hello';
// console.log('is blockchain valid:', blockchain.isChainValid());
// blockchain.chain[1].data = { amount: 22 };

// blockchain.addTransaction(new Transaction('address1', 'address2', 10));
// console.log('address1 amount', blockchain.getBalanceOfAddress('address1'));
// console.log('address2 amount', blockchain.getBalanceOfAddress('address2'));
// blockchain.addTransaction(new Transaction('address2', 'address3', 5));
// console.log('address1 amount', blockchain.getBalanceOfAddress('address1'));
// console.log('address2 amount', blockchain.getBalanceOfAddress('address2'));
// console.log('address3 amount', blockchain.getBalanceOfAddress('address3'));
// blockchain.addTransaction(new Transaction('address3', 'address1', 5));

// console.log('Starting a miner...');
// blockchain.minePendingTransactions('miner');
// console.log(JSON.stringify(blockchain, null, 2));
// console.log('address1 amount', blockchain.getBalanceOfAddress('address1'));
// console.log('address2 amount', blockchain.getBalanceOfAddress('address2'));
// console.log('address3 amount', blockchain.getBalanceOfAddress('address3'));
// console.log('miner amount', blockchain.getBalanceOfAddress('miner'));
// blockchain.minePendingTransactions('miner');
// console.log('miner amount after second mining', blockchain.getBalanceOfAddress('miner'));
