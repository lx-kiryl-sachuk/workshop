# Preparation Guide (Organizer) — NestJS + web3.js + Hardhat ERC-20 (90 min)

This file is for **you (the organizer)**. Everything below is already set up in this repo — this guide explains what was done and how to verify it works.

---

## Repo structure (already created)

```
workshop/
  blockchain/          # Hardhat 2 + ERC-20 contract + deploy script
    contracts/
      WorkshopToken.sol
    scripts/
      deploy.ts
    hardhat.config.ts
    package.json
  api/                 # NestJS + web3.js
    src/
      abi/WorkshopToken.abi.json
      health/          # GET /health
      web3/            # Web3 HTTP + WS providers
      token/           # balance, transfer, history endpoints
      app.module.ts
      main.ts
    .env.example
    package.json
  README.md            # Participant-facing instructions
  WORKSHOP_PLAN.md     # Minute-by-minute facilitation plan
  PREP_GUIDE.md        # This file
```

---

## Tech stack

| Layer      | Tool                          | Version   |
|------------|-------------------------------|-----------|
| Blockchain | Hardhat **2** + ethers v6     | ^2.22     |
| Contract   | OpenZeppelin ERC-20           | ^5.1      |
| Solidity   | 0.8.20                        |           |
| API        | NestJS 11                     |           |
| Web3       | web3.js 4                     |           |
| Runtime    | Node.js 20+                   |           |

---

## Pre-workshop checklist

### 1. Install dependencies (both folders)
```bash
# From repo root
cd blockchain && npm install
cd ../api && npm install
```

### 2. Compile the contract
```bash
cd blockchain
npm run compile
```
This produces `blockchain/artifacts/` with the compiled contract. The ABI is already copied to `api/src/abi/WorkshopToken.abi.json`.

### 3. Smoke test — full end-to-end

**Terminal A** — start local chain:
```bash
cd blockchain
npm run node
```
You'll see 20 test accounts with addresses + private keys. Note the first two:
- Account #0 (deployer): address + private key
- Account #1: address + private key

**Terminal B** — deploy contract:
```bash
cd blockchain
npm run deploy:local
```
Output includes `TOKEN_ADDRESS=0x...`. Copy it.

**Terminal B** — configure and start API:
```bash
cd api
cp .env.example .env
```
Edit `api/.env` and paste the token address:
```
TOKEN_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

Start the API:
```bash
npm run start:dev
```

**Terminal B** — test endpoints:
```bash
# Health check
curl -s http://localhost:3000/health

# Balance (use Account #0 address from Hardhat output)
curl -s http://localhost:3000/token/balance/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# Transfer (use Account #0 private key, Account #1 address)
curl -s -X POST http://localhost:3000/token/transfer \
  -H "Content-Type: application/json" \
  -d '{"fromPk":"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80","to":"0x70997970C51812dc3A010C7d01b50e0d17dc79C8","amount":"1000000000000000000"}'

# History (should show the transfer above)
curl -s http://localhost:3000/token/history
```

### 4. If you need to re-extract the ABI
After recompiling the contract:
```bash
cd blockchain
node -e "const a = require('./artifacts/contracts/WorkshopToken.sol/WorkshopToken.json'); require('fs').writeFileSync('../api/src/abi/WorkshopToken.abi.json', JSON.stringify(a.abi, null, 2))"
```

---

## Key npm scripts

| Folder       | Script              | What it does                        |
|--------------|---------------------|-------------------------------------|
| `blockchain` | `npm run node`      | Start local Hardhat chain (8545)    |
| `blockchain` | `npm run compile`   | Compile Solidity contracts          |
| `blockchain` | `npm run deploy:local` | Deploy to running local chain    |
| `api`        | `npm run start:dev` | Start NestJS in watch mode          |

---

## API endpoints

| Method | Path                    | Description                     |
|--------|-------------------------|---------------------------------|
| GET    | `/health`               | `{ ok: true }`                  |
| GET    | `/token/balance/:addr`  | ERC-20 balance for address      |
| POST   | `/token/transfer`       | Send tokens (body: `{ fromPk, to, amount }`) |
| GET    | `/token/history`        | Recent Transfer events (in-memory) |
| GET    | `/token/history?address=0x...` | Filtered by address      |

---

## Facilitation tips

- **Pre-create a "solution" branch** with this working code
- **Pre-test on a clean laptop** — `rm -rf node_modules` in both folders, reinstall, run full flow
- **Print 2 Hardhat accounts on a slide** so participants can copy/paste:
  - Account #0: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` / `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
  - Account #1: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` / `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

---

## Fallback: if WS subscription fails

Replace the WebSocket event subscription in `token.service.ts` with polling:
```ts
// In onModuleInit(), instead of contractWs.events.Transfer(...)
setInterval(async () => {
  const latest = await this.web3Http.eth.getBlockNumber();
  const events = await this.contractHttp.getPastEvents("Transfer", {
    fromBlock: this.lastBlock + 1,
    toBlock: "latest",
  });
  for (const ev of events) { /* push to history */ }
  this.lastBlock = Number(latest);
}, 3000);
```
