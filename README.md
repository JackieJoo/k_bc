# Simplistic blockchain implementation

- Mines a block every 10 sec.
- Tries to replace the chain every 50 sec.
  - If the received chain is longer AND valid -> replace own chain with the received one
- The node can be:
  - Mining - mines a new block every 10 secs, can receive transactions and broadcast them to other nodes.
  - Static - receiving & broadcasting transactions, no mining.

## Running

```js
npm run start:dev
```

Boots up a node, need to provide at least one peer in order for the node to connect to the network.

As for the port, program searches for the first available tcp port starting from :8000.

If you're running multiple nodes on the same host, most likely they will have addresses
`'ws://localhost:8000', 'ws://localhost:8001', 'ws://localhost:8002' ...`

To see the connection between nodes and chain replacing, it's better to start nodes with some delay

For example:

1. Start the first node (A) in the terminal (`npm run start:dev`)
2. Start the second node (B) after node A mined 5 blocks (you can see mining process in the terminal)
3. After 50 seconds, node B will ask node A about the chain, A's chain will be valid and longer, so node B will replace its chain with A's chain.

## Logging

- After each mined block, you can see the message similar to this

```json
Block is mined: 000053427b7017e4f89787ff75c0fda68b0f7394e59e17f8f1c51b965b5b9bf7

- Size: 4
- Blocks' hashes: [
  "5dbbec51bfcdb9e083517b2a7b836b33dfcee8fdfdb0bbb8c0235802992f932e",
  "000082dd33ca3c4aeeadf9f8a086b4c8e504841c1e2e7a5c56f1233b5ba62b5b",
  "0000d227c060986cbcb5e63c597ca1b251807cca85c5780920ac42eb71908302",
  "000053427b7017e4f89787ff75c0fda68b0f7394e59e17f8f1c51b965b5b9bf7"
]
```

- After each message received from some other node, you will see the full message along with some info about the node

```json
Node url: ws://localhost:8001
Pubkey: 0432a7e71923d1316e10985d9461432a85b8bf4af0aabc26d23f26d72a78dec495a6c219f6be6ab97163337c92cc816584471f1962f070442d56565ca634a9f9e8
Message: {
  "type": "TRANSACTION",
  "data": {
    "from": "04e7fb421d155ce91604d4f4ba574592ef820c70265a4da8991955b3df1c4febc55b5b2f73473dd80487c5dfbe2b58a4d06e9c4a1eac0b0ca6bc95ebede70aec34",
    "to": "some_other_address",
    "amount": 10,
    "signature": "3045022100973021ee511d3d4977315b62d70c9d7918e24b3a2f1d72b71287221319e23a760220231d098bfc8652c0cdf6b2333d9341a5efd1de8d4ce975f523ad639b81a91d69"
  }
}
```

- After replace message

```json
Node url: ws://localhost:8000
Pubkey: 044b893d740e6f375c193eb840862641331e6a00007293368c5c69c7011a1bd5cffe04fc4cd98623164d1b0a4efbeffb8d87995c338d2c7cc87957fc8075677d27
Message: {
  "type": "REPLACE_CHAIN",
  "data": [
    {
      "previousHash": null,
      "hash": "3fc79c6ead774f1538b2f7be8d3454c9974236227965d02d5e569c896cb35c5a",
      "timestamp": "2022-07-25T15:03:17.339Z",
      "transactions": [],
      "nonce": 0
    },
    {
      "previousHash": "3fc79c6ead774f1538b2f7be8d3454c9974236227965d02d5e569c896cb35c5a",
      "hash": "0000191c03e1072a70291697a6b8288fb2972e0a35f014732e829ab726c7c0f4",
      "timestamp": "2022-07-25T15:03:27.346Z",
      "transactions": [
        {
          "from": null,
          "to": "0432a7e71923d1316e10985d9461432a85b8bf4af0aabc26d23f26d72a78dec495a6c219f6be6ab97163337c92cc816584471f1962f070442d56565ca634a9f9e8",
          "amount": 100,
          "signature": ""
        }
      ],
      "nonce": 299
    },
    ...
  ]
}

Received chain length: 11,
Mine chain length: 11,
Is received chain valid: true
Is mine chain valid: true

No chain replacing

Start mining
```

## Message types

- `HANDSHAKE` - connection between nodes
- `TRANSACTION` - new transaction broadcasted from some node
- `BROADCAST_TRANSACTION` - a new transaction is created from this node, need to broadcast it to all nodes
- `GET_CHAIN` - some node is asking us to send our chain
- `REPLACE_CHAIN` - a node received a chain from some other node, if it's valid and longer than ours, we replace the chain 

`GET_CHAIN` is a request to some node, `REPLACE_CHAIN` is a response with chain data.