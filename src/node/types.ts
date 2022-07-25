import { Block, Blockchain, Transaction } from 'src/blockchain';
import WebSocket from 'ws';

export type MessageType =
  | 'HANDSHAKE'
  | 'TRANSACTION'
  | 'BROADCAST_TRANSACTION'
  | 'BLOCK'
  | 'REPLACE_CHAIN'
  | 'GET_CHAIN';

export interface NodeState {
  miningIntervalInMs: number;
  miningIntervalId: NodeJS.Timeout | null;
  chainReplacingIntervalInMs: 50_000;
  chainReplacingIntervalId: NodeJS.Timeout | null;
  isMiningNode: boolean;
  isUpdatingChainInfo: boolean;
  nextReplaceChainNodeIndex: number;
  openedConnections: NodeInfo[];
}

export interface InitOptions {
  mining: true;
}

export interface NodeInfo {
  socket: WebSocket;
  address: string;
}

export interface HandshakeMessage {
  type: 'HANDSHAKE';
  data: Array<NodeInfo['address']>;
}

export interface TransactionMessage {
  type: 'TRANSACTION';
  data: Transaction;
}

export interface BroadcastTransactionMessage {
  type: 'BROADCAST_TRANSACTION';
  data: Transaction;
}

export interface BlockMessage {
  type: 'BLOCK';
  data: Block;
}

export interface ChainMessage {
  type: 'REPLACE_CHAIN';
  data: Block[] | null;
}

export interface GetChainMessage {
  type: 'GET_CHAIN';
  data: string;
  // data: {
  //   chain_length: number;
  //   address: string;
  // };
}

export type Message =
  | HandshakeMessage
  | TransactionMessage
  | BroadcastTransactionMessage
  | BlockMessage
  | ChainMessage
  | GetChainMessage;
