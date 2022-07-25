import Node from './node';
import * as PF from 'portfinder';

async function main() {
  const port = await PF.getPortPromise();
  const node = new Node(port, ['ws://localhost:8000']);
  node.init({ mining: true });

  /*
    UNCOMMENT TO SEND TRANSACTIONS
    Every node will send a transaction every 10 secs, every other node will first reject it
    But when some node (lets say "C") grows longer, 
      its chain will be considered the correct one, 
      after that other nodes will replace their chains with C's chain, and trxs from C will be considered valid.
  */
  // setInterval(() => {
  //   const imaginaryAddress = 'some_other_address';
  //   node.sendTransaction(imaginaryAddress, 10);
  //   console.log(
  //     `address balance: ${node.blockchain.getBalanceOfAddress(
  //       imaginaryAddress
  //     )}\nminer balance: ${node.blockchain.getBalanceOfAddress(node.publicKey)}\n`
  //   );
  // }, 10_000);
}

Promise.resolve()
  .then(async () => main())
  .catch((err: any) => {
    console.error('Main catch', err);
    process.exit(1);
  });
