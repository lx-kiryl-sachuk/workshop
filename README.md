# Workshop: Local ERC-20 + NestJS API (web3.js)

Build a NestJS API that talks to a local ERC-20 token on a Hardhat blockchain.

## Prerequisites

- **Node.js v20+** and npm
- Git

## Quick Start

### 1. Install dependencies

```bash
cd blockchain && npm install
cd ../api && npm install
```

### 2. Compile the smart contract

```bash
cd blockchain
npm run compile
```

### 3. Start local blockchain (Terminal A)

```bash
cd blockchain
npm run node
```

You'll see 20 test accounts. Keep this terminal running.

### 4. Deploy the token (Terminal B)

```bash
cd blockchain
npm run deploy:local
```

Copy the `TOKEN_ADDRESS` from the output.

### 5. Configure and start the API (Terminal B)

```bash
cd api
cp .env.example .env
```

Edit `.env` and paste your token address:
```
TOKEN_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

Start the API:
```bash
npm run start:dev
```

### 6. Try it out

```bash
# Health check
curl -s http://localhost:3000/health

# Check balance (use an address from Hardhat node output)
curl -s http://localhost:3000/token/balance/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# Transfer tokens (use Account #0 private key → Account #1 address)
curl -s -X POST http://localhost:3000/token/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "fromPk": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    "to": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "amount": "1000000000000000000"
  }'

# View transfer history
curl -s http://localhost:3000/token/history
```

## API Endpoints

| Method | Path                         | Description                              |
|--------|------------------------------|------------------------------------------|
| GET    | `/health`                    | Health check                             |
| GET    | `/token/balance/:address`    | Get ERC-20 balance                       |
| POST   | `/token/transfer`            | Transfer tokens (`{ fromPk, to, amount }`) |
| GET    | `/token/history`             | List recent Transfer events              |
| GET    | `/token/history?address=0x…` | Filter history by address                |

## Useful Hardhat Test Accounts

| Account | Address | Private Key |
|---------|---------|-------------|
| #0 (deployer) | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| #1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |

> These are **test-only** keys from Hardhat. Never use them on a real network.
