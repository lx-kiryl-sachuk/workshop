# Workshop Plan (90 min) — NestJS + web3.js + Hardhat ERC-20

**For the organizer.** Step-by-step facilitation guide. Participants use `README.md`.

---

## Goal

By the end, every participant has:
- A local EVM chain running (Hardhat)
- An ERC-20 token deployed
- A NestJS API that reads balances, sends transfers, and **listens to Transfer events in real-time via WebSocket**

---

## Before the workshop

### Pre-flight checklist

1. **Test on a clean machine** — clone the repo, install deps, run the full flow
2. **Prepare a slide** with the two Hardhat test accounts (so people can copy/paste):

| Account | Address | Private Key |
|---------|---------|-------------|
| #0 (deployer) | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| #1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |

3. **Remind participants beforehand**: Node.js v20+, npm, Git
4. The `solution` branch has the full working code — point stuck participants there

---

## Timeline

### 0–5 min — Intro

**What to say:**
- Smart contract = state + methods, lives on-chain
- Events = a log stream (like Node EventEmitter, but on-chain)
- Today's plan: deploy a token → build an API that reads balances → sends transfers → **subscribes to Transfer events via WebSocket** and serves `/history`

### 5–15 min — Clone & install

Tell participants to follow `README.md`. Walk through it on screen:

```bash
git clone https://github.com/lx-kiryl-sachuk/workshop.git
cd workshop
cd blockchain && npm install
cd ../api && npm install
```

Compile the contract:
```bash
cd blockchain
npm run compile
```

**Common issue:** wrong Node version. Have them run `node -v` first.

### 15–25 min — Start local blockchain

**Terminal A** (keep running):
```bash
cd blockchain
npm run node
```

Point out the 20 test accounts with 10,000 ETH each. Show the slide with Account #0 and #1.

### 25–35 min — Deploy the ERC-20 token

**Terminal B:**
```bash
cd blockchain
npm run deploy:local
```

Output:
```
Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
TOKEN_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

Have everyone copy the token address. Then configure the API:
```bash
cd api
cp .env.example .env
```
Edit `.env` → paste `TOKEN_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3`

### 35–45 min — Coding: Web3Module

**File:** `api/src/web3/web3.module.ts`

Participants fill in the TODO stubs:
1. Import `Web3`
2. Create `WEB3_HTTP` provider — `new Web3(process.env.RPC_HTTP)`
3. Create `WEB3_WS` provider — `new Web3(new Web3.providers.WebsocketProvider(process.env.RPC_WS))`

**Explain:** HTTP for read/write calls, WebSocket for real-time event subscriptions.

### 45–55 min — Coding: TokenService (balance + transfer)

**File:** `api/src/token/token.service.ts`

Participants fill in:
1. `onModuleInit()` — initialize contract instances from ABI + address
2. `balanceOf()` — call `contractHttp.methods.balanceOf(address).call()`
3. `transfer()` — derive account from private key, build tx, estimate gas, send

Start the API and test:
```bash
npm run start:dev
```
```bash
curl -s http://localhost:3000/health
curl -s http://localhost:3000/token/balance/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
curl -s -X POST http://localhost:3000/token/transfer \
  -H "Content-Type: application/json" \
  -d '{"fromPk":"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80","to":"0x70997970C51812dc3A010C7d01b50e0d17dc79C8","amount":"1000000000000000000"}'
```

### 55–70 min — Coding: Event subscription + HistoryStore

**This is the highlight of the workshop.**

**File:** `api/src/token/token.service.ts` — `onModuleInit()`

Participants add the WebSocket subscription (web3.js v4 API):
```ts
const subscription = this.contractWs.events.Transfer();
subscription.on('data', (ev) => { /* push to history */ });
subscription.on('error', (err) => { /* log error */ });
```

**File:** `api/src/token/history.store.ts`

Participants fill in `push()` and `list()`.

Restart API, make a transfer, then:
```bash
curl -s http://localhost:3000/token/history
curl -s "http://localhost:3000/token/history?address=0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
```

**Key teaching moment:** the event appeared in `/history` without polling — it was pushed via WebSocket in real-time.

### 70–85 min — Mini challenge (pick one)

| Difficulty | Challenge |
|------------|-----------|
| Easy | Add `?minValue=` query filter to `/token/history` |
| Medium | Add `GET /token/stats` → `{ totalTransfers, totalVolume }` |
| Medium+ | Detect "whale transfer" (threshold from env) and log an alert |

Point fast groups to the `solution` branch for reference.

### 85–90 min — Wrap-up

**What they built** maps to real-world systems:
- Block explorers (Etherscan)
- Wallet backends
- Event-driven indexers (The Graph, custom indexers)
- DeFi monitoring / alerting

**Next steps** (if they want to keep going):
- Store history in Postgres instead of memory
- Handle chain reorgs
- Add pagination + historical block scanning
- Deploy to a testnet (Sepolia)

---

## Troubleshooting cheat sheet

| Problem | Fix |
|---------|-----|
| WS subscription doesn't fire | Hardhat node not running, or wrong `RPC_WS` in `.env`. Restart API. |
| `insufficient funds` | Using a private key not from Hardhat's test accounts |
| `Invalid JSON RPC response` | Hardhat node not running or wrong port |
| `EADDRINUSE :3000` | Another process on port 3000. Kill it: `lsof -ti:3000 \| xargs kill` |
| Contract not found | Token not deployed, or wrong `TOKEN_ADDRESS` in `.env` |

---

## Fallback: if WS subscription fails

Replace the WebSocket subscription in `token.service.ts` with HTTP polling:
```ts
private lastBlock = 0;

async onModuleInit() {
  // ... init contract ...
  this.lastBlock = Number(await this.web3Http.eth.getBlockNumber());
  setInterval(() => this.pollTransferEvents(), 2000);
}

private async pollTransferEvents() {
  const latest = Number(await this.web3Http.eth.getBlockNumber());
  if (latest <= this.lastBlock) return;
  const events = await this.contractHttp.getPastEvents('Transfer', {
    fromBlock: this.lastBlock + 1, toBlock: 'latest',
  });
  for (const ev of events) { /* push to history */ }
  this.lastBlock = latest;
}
```

---

## Reference

### Repo structure
```
workshop/
  blockchain/            # Hardhat 2 + ERC-20 contract
    contracts/WorkshopToken.sol
    scripts/deploy.ts
    hardhat.config.ts
  api/                   # NestJS + web3.js (skeleton with TODOs)
    src/
      abi/WorkshopToken.abi.json
      health/            # GET /health (done)
      web3/              # Web3 providers (TODO)
      token/             # balance, transfer, history (TODO)
    .env.example
  README.md              # Participant instructions
  PREP_GUIDE.md          # This file
```

### npm scripts

| Folder | Script | What it does |
|--------|--------|--------------|
| `blockchain` | `npm run node` | Start local chain on port 8545 |
| `blockchain` | `npm run compile` | Compile Solidity contracts |
| `blockchain` | `npm run deploy:local` | Deploy to running local chain |
| `api` | `npm run start:dev` | Start NestJS in watch mode |

### API endpoints (when complete)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | `{ ok: true }` |
| GET | `/token/balance/:address` | ERC-20 balance |
| POST | `/token/transfer` | Send tokens (`{ fromPk, to, amount }`) |
| GET | `/token/history` | Recent Transfer events (in-memory) |
| GET | `/token/history?address=0x...` | Filtered by address |
