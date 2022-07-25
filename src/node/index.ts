import WebSocket, { WebSocketServer } from 'ws';
import { Block, Blockchain, Transaction } from '../blockchain';
import { keyPair } from '../utils/keygenerator';
import { ec as EC } from 'elliptic';
import { Message, InitOptions, NodeState } from './types';

export default class Node {
  private readonly state: NodeState = {
    miningIntervalInMs: 10_000,
    miningIntervalId: null,
    chainReplacingIntervalInMs: 50_000,
    chainReplacingIntervalId: null,
    isMiningNode: false,
    isUpdatingChainInfo: false,
    nextReplaceChainNodeIndex: 0,
    openedConnections: [],
  };

  private readonly port: number = 3000;
  private readonly url: string;
  private readonly peers: string[];
  private server: WebSocketServer | null = null;

  readonly blockchain: Blockchain;
  readonly keyPair: EC.KeyPair;
  readonly publicKey: string;

  constructor(port: number = 4000, peers: string[]) {
    this.port = port;
    this.peers = peers; // need to provide at least one peer
    this.url = `ws://localhost:${port}`;
    this.keyPair = keyPair;
    this.publicKey = this.keyPair.getPublic('hex');
    this.blockchain = new Blockchain();
  }

  init(opts?: InitOptions) {
    this.server = new WebSocketServer({ port: this.port });
    this.server.on('connection', (socket, req) => {
      console.log(`\nNode connected: ${req.socket.remoteAddress}\n`);
      this.setUpMessageListeners(socket);
    });
    console.log(`\nNode is listening on port ${this.port} ...`);

    // connect to peers
    this.peers.forEach((peer: string) => this.connectToNode(peer));

    if (opts?.mining) {
      this.state.isMiningNode = true;
      this.setUpMining();
    }

    this.setUpChainReplacing(); // schedule receiving a full chain
  }

  stop() {
    this.server?.close();
    this.tearDownMining();
  }

  connectToNode(address: string) {
    const node = this.state.openedConnections.find(({ address: peerAddress }) => peerAddress === address);
    if (node) {
      return node.socket;
    }

    if (!node && address !== this.url) {
      const socket = new WebSocket(address);

      socket.on('open', () => {
        // introduce your connected nodes to the node
        socket.send(
          this.stringifyMessage({
            type: 'HANDSHAKE',
            data: [this.url, ...this.state.openedConnections.map((node) => node.address)],
          }),
          (err: any) => {
            if (err) {
              throw err;
            }

            this.state.openedConnections.push({ socket, address });
          }
        );

        // introduce the node to your connected nodes
        this.state.openedConnections.forEach((node) =>
          node.socket.send(this.stringifyMessage({ type: 'HANDSHAKE', data: [address] }))
        );
      });

      socket.on('close', () => {
        this.state.openedConnections.splice(
          this.state.openedConnections.findIndex((node) => node.address === address),
          1
        );
      });

      return socket;
    }

    return null;
  }

  async setUpMessageListeners(socket: WebSocket) {
    socket.on('message', async (msg: string) => {
      const message: Message = JSON.parse(msg);
      console.log(
        `
Node url: ${this.url}
Pubkey: ${this.publicKey}
Message: ${msg}
`
      );

      switch (message.type) {
        case 'HANDSHAKE': // connection between nodes
          this.handleHandshakeMsg(message.data);
          return;
        case 'TRANSACTION': // broadcasted transaction from some node
          this.handleTrxMsg(message.data);
          return;
        case 'BROADCAST_TRANSACTION': // this is the node that first received trx, need to broadcast it to all nodes
          this.handleBroadcastTrxMessage(message.data);
          return;
        case 'GET_CHAIN': // some node is asking about the full chain
          if (this.state.isUpdatingChainInfo) {
            return;
          }
          await this.handleGetChainMsg(message.data);
          return;
        case 'REPLACE_CHAIN': // we asked about a full chain, and this message is an answer to the `GET_CHAIN` message
          if (this.state.isUpdatingChainInfo) {
            return;
          }
          this.state.isUpdatingChainInfo = true;
          this.handleReplaceChainMsg(message.data);
          return;
      }
    });
  }

  handleHandshakeMsg(nodes: string[]) {
    nodes.forEach((node) => this.connectToNode(node));
  }

  handleTrxMsg(trx: Transaction) {
    try {
      this.blockchain.addTransaction(trx);
      console.log(`\nSuccessfully added the transaction: ${JSON.stringify(trx, null, 2)}`);
    } catch (error) {
      console.error(`\nError adding the transaction: ${JSON.stringify(trx, null, 2)}`);
      console.error(error);
    }
  }

  handleBroadcastTrxMessage(newTrx: Transaction) {
    try {
      this.blockchain.addTransaction(newTrx);
      console.log(`\nBroadcasting transaction: ${JSON.stringify(newTrx, null, 2)}`);
      this.sendMessageToAllNodes({
        type: 'TRANSACTION',
        data: newTrx,
      });
    } catch (error) {
      console.error('\nError adding or broadcasting the transaction');
      console.error(error);
    }
  }

  async handleGetChainMsg(address: string) {
    try {
      const socket = this.connectToNode(address);

      console.log(`\nSending full chain info to ${address}`);

      socket?.send(
        this.stringifyMessage({
          type: 'REPLACE_CHAIN',
          data: this.blockchain.size <= 1 ? null : this.blockchain.chain,
        })
      );
    } catch (error) {
      console.error('\nError sending chain data');
      console.error(error);
    }
  }

  handleReplaceChainMsg(chain: Block[] | null) {
    console.log(`
Received chain length: ${chain?.length || 1},
Mine chain length: ${this.blockchain.size},
Is received chain valid: ${chain == null ? "chain is null, we don't know" : Blockchain.isChainValid(chain)}
Is mine chain valid: ${Blockchain.isChainValid(this.blockchain.chain)}
    `);

    if (chain === null || chain?.length <= this.blockchain.size || !Blockchain.isChainValid(chain)) {
      console.log('No chain replacing');
    } else {
      console.log('\n Replacing chain ...');
      this.blockchain.pendingTransactions = [];
      this.blockchain.chain = chain;
      // console.log(`\n New chain: ${JSON.stringify(chain)}`);
    }

    this.setUpMining();
    this.state.isUpdatingChainInfo = false;
  }

  setUpMining() {
    if (this.state.isMiningNode && this.state.miningIntervalId === null) {
      console.log('\nStart mining');
      this.state.miningIntervalId = setInterval(this.mineBlock.bind(this), this.state.miningIntervalInMs);
    }
  }

  tearDownMining() {
    if (this.state.miningIntervalId) {
      console.log('\nStop mining');
      clearInterval(this.state.miningIntervalId);
      this.state.miningIntervalId = null;
    }
  }

  setUpChainReplacing() {
    if (this.state.chainReplacingIntervalId === null) {
      this.state.chainReplacingIntervalId = setInterval(
        this.askForFullChain.bind(this),
        this.state.chainReplacingIntervalInMs
      );
    }
  }

  tearDownChainReplacing() {
    if (this.state.chainReplacingIntervalId) {
      clearInterval(this.state.chainReplacingIntervalId);
      this.state.chainReplacingIntervalId = null;
    }
  }

  mineBlock() {
    this.blockchain.minePendingTransactions(this.publicKey);
    console.log(
      `
- Size: ${this.blockchain.size}
- Blocks' hashes: ${JSON.stringify(
        this.blockchain.chain.map((el) => el.hash),
        null,
        2
      )}
`
    );
  }

  askForFullChain() {
    if (this.state.openedConnections.length > 0) {
      console.log(
        `\nAsking node: ${
          this.state.openedConnections[this.state.nextReplaceChainNodeIndex].address
        } for a full chain info`
      );

      if (this.state.isMiningNode) {
        // ask about chain info, when we're sure mining is stopped
        this.tearDownMining();
        setTimeout(() => {
          this.sendGetChainMsg();
        }, this.state.miningIntervalInMs);
      } else {
        this.sendGetChainMsg();
      }
    }
  }

  sendGetChainMsg() {
    this.state.openedConnections[this.state.nextReplaceChainNodeIndex].socket.send(
      this.stringifyMessage({
        type: 'GET_CHAIN',
        data: this.url,
      })
    );
    // update `nextReplaceChainNodeIndex` so that each time we're asking for a full chain we asking a different node
    this.state.nextReplaceChainNodeIndex =
      this.state.nextReplaceChainNodeIndex === this.state.openedConnections.length - 1
        ? 0
        : this.state.nextReplaceChainNodeIndex + 1;
  }

  stringifyMessage(message: Message) {
    return JSON.stringify(message, null, 2);
  }

  sendTransaction(/* from: string, */ to: string, amount: number) {
    const trx = new Transaction(this.publicKey, to, amount);
    trx.sign(this.keyPair);
    this.handleBroadcastTrxMessage(trx);
  }

  sendMessageToAllNodes(message: Message) {
    this.state.openedConnections.forEach((node) => {
      node.socket.send(this.stringifyMessage(message));
    });
  }
}
