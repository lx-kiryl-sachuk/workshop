# Preparation Guide (Organizer) — NestJS + web3.js + Hardhat ERC-20 (90 min)

This file is for **you (the organizer)** to prepare the workshop so participants spend time building, not debugging.

---

## 1) Create the repo
```
workshop/
  blockchain/
  api/
  README.md
```

Recommended: use **one repo** with two folders.

---

## 2) Blockchain part (Hardhat)

### 2.1 Initialize
```bash
mkdir -p workshop/blockchain
cd workshop/blockchain
npm init -y
npm i -D hardhat typescript ts-node @types/node
npx hardhat --init
# choose "TypeScript project"
```

### 2.2 Add OpenZeppelin ERC-20
```bash
npm i @openzeppelin/contracts
```

### 2.3 Contract: `contracts/WorkshopToken.sol`
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WorkshopToken is ERC20 {
    constructor() ERC20("WorkshopToken", "WST") {
        _mint(msg.sender, 1_000_000 ether);
    }
}
```

### 2.4 Deploy script: `scripts/deploy.ts`
```ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Token = await ethers.getContractFactory("WorkshopToken");
  const token = await Token.deploy();
  await token.waitForDeployment();

  const addr = await token.getAddress();
  console.log("TOKEN_ADDRESS=" + addr);
  console.log("CHAIN_ID=31337");
  console.log("RPC_HTTP=http://127.0.0.1:8545");
  console.log("RPC_WS=ws://127.0.0.1:8545");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
```

### 2.5 Minimal Hardhat config sanity
Make sure `hardhat.config.ts` includes solidity 0.8.20+ and localhost network default is fine.

### 2.6 Add helper scripts to `blockchain/package.json`
```json
{
  "scripts": {
    "node": "hardhat node",
    "deploy:local": "hardhat run scripts/deploy.ts --network localhost",
    "compile": "hardhat compile"
  }
}
```

### 2.7 Test it yourself
Terminal A:
```bash
npm run node
```
Terminal B:
```bash
npm run deploy:local
```

---

## 3) API part (NestJS + web3.js)

### 3.1 Initialize Nest app
```bash
cd ../
mkdir -p api
cd api
npx @nestjs/cli new api --package-manager npm
# or: nest new api
```

If you used `nest new api`, move contents up so `workshop/api/` is the Nest root.

### 3.2 Install deps
```bash
npm i web3 dotenv
npm i -D @types/node
```

Optional (for nicer input validation):
```bash
npm i class-validator class-transformer
```

### 3.3 Env template: `api/.env.example`
```dotenv
RPC_HTTP=http://127.0.0.1:8545
RPC_WS=ws://127.0.0.1:8545
TOKEN_ADDRESS=
CHAIN_ID=31337
HISTORY_LIMIT=200
```

### 3.4 Architecture (Nest modules)
```
api/src/
  app.module.ts
  health/
    health.controller.ts
    health.module.ts
  web3/
    web3.constants.ts
    web3.module.ts
  token/
    dto/
      transfer.dto.ts
    history.store.ts
    token.controller.ts
    token.module.ts
    token.service.ts
  abi/
    WorkshopToken.abi.json
```

### 3.5 ABI handling (recommended)
Copy ABI into API so participants don’t fight paths.

After compiling contract once:
- `blockchain/artifacts/contracts/WorkshopToken.sol/WorkshopToken.json` contains `abi`
Extract ABI into:
- `api/src/abi/WorkshopToken.abi.json`

You can do it manually once, or via script.

### 3.6 Web3Module
`api/src/web3/web3.constants.ts`
```ts
export const WEB3_HTTP = "WEB3_HTTP";
export const WEB3_WS = "WEB3_WS";
```

`api/src/web3/web3.module.ts`
```ts
import { Module } from "@nestjs/common";
import Web3 from "web3";
import { WEB3_HTTP, WEB3_WS } from "./web3.constants";

@Module({
  providers: [
    {
      provide: WEB3_HTTP,
      useFactory: () => new Web3(process.env.RPC_HTTP ?? "http://127.0.0.1:8545"),
    },
    {
      provide: WEB3_WS,
      useFactory: () =>
        new Web3(
          new Web3.providers.WebsocketProvider(process.env.RPC_WS ?? "ws://127.0.0.1:8545")
        ),
    },
  ],
  exports: [WEB3_HTTP, WEB3_WS],
})
export class Web3Module {}
```

### 3.7 HistoryStore (in-memory)
`api/src/token/history.store.ts`
```ts
import { Injectable } from "@nestjs/common";

export type TransferEvent = {
  txHash: string;
  from: string;
  to: string;
  value: string;
  blockNumber: number;
};

@Injectable()
export class HistoryStore {
  private items: TransferEvent[] = [];
  private limit = Number(process.env.HISTORY_LIMIT ?? 200);

  push(ev: TransferEvent) {
    this.items.unshift(ev);
    if (this.items.length > this.limit) this.items = this.items.slice(0, this.limit);
  }

  list(address?: string) {
    if (!address) return this.items;
    const a = address.toLowerCase();
    return this.items.filter((x) => x.from.toLowerCase() === a || x.to.toLowerCase() === a);
  }
}
```

### 3.8 Transfer DTO
`api/src/token/dto/transfer.dto.ts`
```ts
export class TransferDto {
  fromPk!: string;  // 0x...
  to!: string;      // 0x...
  amount!: string;  // wei-like smallest units as string
}
```

### 3.9 TokenService (core)
`api/src/token/token.service.ts`
```ts
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import Web3 from "web3";
import type { Contract } from "web3-eth-contract";
import ABI from "../abi/WorkshopToken.abi.json";
import { WEB3_HTTP, WEB3_WS } from "../web3/web3.constants";
import { HistoryStore } from "./history.store";

@Injectable()
export class TokenService implements OnModuleInit {
  private contractHttp!: Contract;
  private contractWs!: Contract;

  constructor(
    @Inject(WEB3_HTTP) private readonly web3Http: Web3,
    @Inject(WEB3_WS) private readonly web3Ws: Web3,
    private readonly history: HistoryStore,
  ) {}

  onModuleInit() {
    const tokenAddress = process.env.TOKEN_ADDRESS;
    if (!tokenAddress) throw new Error("TOKEN_ADDRESS is required");

    this.contractHttp = new this.web3Http.eth.Contract(ABI as any, tokenAddress);
    this.contractWs = new this.web3Ws.eth.Contract(ABI as any, tokenAddress);

    // Subscribe to Transfer events (WS)
    this.contractWs.events
      .Transfer({ fromBlock: "latest" })
      .on("data", (ev: any) => {
        const { from, to, value } = ev.returnValues;
        this.history.push({
          txHash: ev.transactionHash,
          from,
          to,
          value: value.toString(),
          blockNumber: Number(ev.blockNumber),
        });
      })
      .on("error", (err: any) => console.error("Transfer subscription error", err));
  }

  async balanceOf(address: string) {
    const bal = await this.contractHttp.methods.balanceOf(address).call();
    return { address, balance: bal.toString() };
  }

  async transfer(fromPk: string, to: string, amount: string) {
    const account = this.web3Http.eth.accounts.privateKeyToAccount(fromPk);
    this.web3Http.eth.accounts.wallet.add(account);

    const tx = this.contractHttp.methods.transfer(to, amount);
    const gas = await tx.estimateGas({ from: account.address });
    const receipt = await tx.send({ from: account.address, gas });

    return { from: account.address, to, amount, txHash: receipt.transactionHash };
  }

  historyList(address?: string) {
    return this.history.list(address);
  }
}
```

### 3.10 TokenController
`api/src/token/token.controller.ts`
```ts
import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { TransferDto } from "./dto/transfer.dto";
import { TokenService } from "./token.service";

@Controller("token")
export class TokenController {
  constructor(private readonly token: TokenService) {}

  @Get("balance/:address")
  balance(@Param("address") address: string) {
    return this.token.balanceOf(address);
  }

  @Post("transfer")
  transfer(@Body() dto: TransferDto) {
    return this.token.transfer(dto.fromPk, dto.to, dto.amount);
  }

  @Get("history")
  history(@Query("address") address?: string) {
    return this.token.historyList(address);
  }
}
```

### 3.11 TokenModule
`api/src/token/token.module.ts`
```ts
import { Module } from "@nestjs/common";
import { Web3Module } from "../web3/web3.module";
import { HistoryStore } from "./history.store";
import { TokenController } from "./token.controller";
import { TokenService } from "./token.service";

@Module({
  imports: [Web3Module],
  controllers: [TokenController],
  providers: [TokenService, HistoryStore],
})
export class TokenModule {}
```

### 3.12 Health endpoint (optional but useful)
`api/src/health/health.controller.ts`
```ts
import { Controller, Get } from "@nestjs/common";
@Controller("health")
export class HealthController {
  @Get()
  ok() { return { ok: true }; }
}
```

### 3.13 Wire modules
In `app.module.ts`, import `TokenModule` + `HealthModule`.

### 3.14 Run it end-to-end
1) Start chain:
```bash
cd workshop/blockchain
npm run node
```

2) Deploy:
```bash
npm run deploy:local
```

3) Start API:
```bash
cd ../api
cp .env.example .env
# paste TOKEN_ADDRESS into .env
npm run start:dev
```

4) Test:
```bash
curl -s http://localhost:3000/health
curl -s http://localhost:3000/token/history
```

---

## 4) Workshop README (participant-facing)
Keep it short: 10–12 commands max.
Include:
- start node
- deploy
- copy token address
- start api
- curl for balance/transfer/history

---

## 5) Facilitation tips (time savers)
- Pre-create a “solution” branch with working API
- Pre-test on a clean laptop
- Print 2 hardhat accounts on the slide:
  - `ADDR_A + PK_A`
  - `ADDR_B + PK_B`
So people can copy/paste quickly

---

## 6) Optional fallback if WS fails
Replace subscription with polling:
- every 3s call `getPastEvents("Transfer", { fromBlock: lastBlock+1, toBlock: "latest" })`
- update `lastBlock`

This is a reliable backup to avoid WS headaches.
