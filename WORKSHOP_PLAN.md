# Workshop (90 min): Local ERC-20 + NestJS API (web3.js) + Transfer Event Stream

## Goal (what participants ship)
By the end, everyone has:
- Local EVM chain running (Hardhat)
- ERC-20 token deployed
- NestJS API using **web3.js**:
  - `GET /token/balance/:address`
  - `POST /token/transfer`
  - `GET /token/history` (live from `Transfer` events)

---

## Prereqs for participants (tell them before the session)
- Node.js **v20+** (or v18+), npm
- Git
- (Optional) Docker Desktop (not required in this 90 min version)

---

## Repo layout (what you provide)
```
workshop/
  blockchain/     # hardhat node + contract + deploy script
  api/            # nestjs + web3.js
  README.md
```

---

## Timeline (minute-by-minute)

### 0–5 — Intro + “what we’re building”
- Smart contract = state + methods
- Events = stream (like Node event emitter)
- Our plan: deploy token → Nest reads balances → Nest sends transfers → Nest subscribes to `Transfer` events and serves `/history`

### 5–15 — Clone repo, install deps
**Commands**
```bash
git clone <YOUR_REPO_URL> workshop
cd workshop
```

Install blockchain deps:
```bash
cd blockchain
npm ci || npm i
```

Install API deps:
```bash
cd ../api
npm ci || npm i
```

Quick sanity:
```bash
node -v
npm -v
```

### 15–25 — Start local blockchain node
**Terminal A**
```bash
cd workshop/blockchain
npx hardhat node
```

You should see 20 test accounts + private keys.

### 25–35 — Deploy ERC-20 token
**Terminal B**
```bash
cd workshop/blockchain
npx hardhat run scripts/deploy.ts --network localhost
```

Output will include:
- `TOKEN_ADDRESS=0x...`
- a suggested `DEPLOYER_PRIVATE_KEY=0x...` (or remind to use one printed by Hardhat node)

Copy token address.

### 35–45 — Configure Nest API env + start it
Create API env file:
```bash
cd ../api
cp .env.example .env
```

Edit `.env` (paste token address):
```dotenv
RPC_HTTP=http://127.0.0.1:8545
RPC_WS=ws://127.0.0.1:8545
TOKEN_ADDRESS=0xYOUR_TOKEN_ADDRESS
CHAIN_ID=31337
```

Start API:
```bash
npm run start:dev
```

Health check:
```bash
curl -s http://localhost:3000/health
```

### 45–60 — Use API: balance + transfer
Pick two addresses from Hardhat node output:
- `ADDR_A` (with `PK_A`)
- `ADDR_B`

**Balance**
```bash
curl -s http://localhost:3000/token/balance/ADDR_A | jq
```

**Transfer** (amount in wei units; if token uses 18 decimals, `1e18` = 1 token)
```bash
curl -s -X POST http://localhost:3000/token/transfer \
  -H "Content-Type: application/json" \
  -d '{"fromPk":"PK_A","to":"ADDR_B","amount":"1000000000000000000"}' | jq
```

Re-check balances:
```bash
curl -s http://localhost:3000/token/balance/ADDR_A | jq
curl -s http://localhost:3000/token/balance/ADDR_B | jq
```

### 60–75 — “WTF that’s cool”: live Transfer stream → /history
Make a few transfers again, then:
```bash
curl -s http://localhost:3000/token/history | jq
```

Explain:
- We are subscribed to `Transfer` via WS provider
- We store events in memory (like a mini-indexer)
- You can filter by address:
```bash
curl -s "http://localhost:3000/token/history?address=ADDR_B" | jq
```

### 75–88 — Mini challenge (choose 1)
**Option A (easy):** Add `?minValue=` filter  
**Option B (medium):** `GET /token/stats` → total transfers count + total volume  
**Option C (medium+):** Detect “large transfer” and log an alert (threshold from env)

You can provide “solution branch” for fast groups.

### 88–90 — Wrap-up
- What you built maps to real-world: indexers, explorers, wallets, event-driven pipelines
- Next steps:
  - store history in Postgres
  - handle reorgs
  - add pagination + fromBlock scans

---

## Troubleshooting quick hits
- **WS subscription doesn’t receive events**
  - Ensure Hardhat node is running and `RPC_WS=ws://127.0.0.1:8545`
  - Restart API
- **`insufficient funds`**
  - You’re using a private key not from Hardhat node accounts
- **`Invalid JSON RPC response`**
  - Hardhat node not running / wrong port
