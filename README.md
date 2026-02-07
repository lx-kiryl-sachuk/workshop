# Workshop: Local ERC-20 + NestJS API with Real-Time Events

Build a NestJS API that deploys an ERC-20 token on a local blockchain, reads balances, sends transfers, and **listens to Transfer events in real-time via WebSocket**.

## Prerequisites

- **Node.js v20+** (`node -v` to check)
- **npm**
- **Git**

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/lx-kiryl-sachuk/workshop.git
cd workshop
```

### 2. Install dependencies

```bash
cd blockchain
npm install

cd ../api
npm install
```

### 3. Compile the smart contract

```bash
cd blockchain
npm run compile
```

---

## Run the blockchain

You need **two terminals** open for the rest of the workshop.

### Terminal A — start the local chain

```bash
cd blockchain
npm run node
```

This starts a local Ethereum node on `http://127.0.0.1:8545`. You'll see **20 test accounts** with addresses and private keys. Keep this terminal running.

### Terminal B — deploy the token

```bash
cd blockchain
npm run deploy:local
```

You'll see output like:
```
Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
TOKEN_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

Copy the `TOKEN_ADDRESS`.

---

## Configure the API

```bash
cd api
cp .env.example .env
```

Open `.env` and paste your token address:

```dotenv
RPC_HTTP=http://127.0.0.1:8545
RPC_WS=ws://127.0.0.1:8545
TOKEN_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
CHAIN_ID=31337
HISTORY_LIMIT=200
```

---

## What you'll build

The API skeleton is in `api/src/`. The structure is already set up — you need to fill in the `TODO` comments in these files:

| File | What to implement |
|------|-------------------|
| `src/web3/web3.module.ts` | Create Web3 HTTP and WebSocket providers |
| `src/token/token.service.ts` | Contract init, balance, transfer, event subscription |
| `src/token/history.store.ts` | In-memory event storage (push + list) |

### Start the API (after filling in TODOs)

```bash
cd api
npm run start:dev
```

---

## Test your API

```bash
# Health check
curl -s http://localhost:3000/health

# Check deployer balance
curl -s http://localhost:3000/token/balance/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# Transfer 1 token (Account #0 → Account #1)
curl -s -X POST http://localhost:3000/token/transfer \
  -H "Content-Type: application/json" \
  -d '{"fromPk":"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80","to":"0x70997970C51812dc3A010C7d01b50e0d17dc79C8","amount":"1000000000000000000"}'

# View transfer history (populated via WebSocket subscription)
curl -s http://localhost:3000/token/history

# Filter history by address
curl -s "http://localhost:3000/token/history?address=0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
```

---

## Test Accounts

These are Hardhat's default accounts — same for everyone:

| Account | Address | Private Key |
|---------|---------|-------------|
| #0 (deployer) | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| #1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |

> These are **test-only** keys. Never use them on a real network.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check → `{ ok: true }` |
| GET | `/token/balance/:address` | ERC-20 balance for an address |
| POST | `/token/transfer` | Send tokens. Body: `{ fromPk, to, amount }` |
| GET | `/token/history` | Recent Transfer events (from WS subscription) |
| GET | `/token/history?address=0x...` | Filter history by address |

---

## Stuck?

Check out the `solution` branch for the full working code:

```bash
git checkout solution
```
