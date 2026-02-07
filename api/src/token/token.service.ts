import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import Web3 from "web3";
import ABI from "../abi/WorkshopToken.abi.json";
import { WEB3_HTTP, WEB3_WS } from "../web3/web3.constants";
import { HistoryStore } from "./history.store";

@Injectable()
export class TokenService implements OnModuleInit {
  private readonly logger = new Logger(TokenService.name);
  private contractHttp: any;
  private contractWs: any;

  constructor(
    @Inject(WEB3_HTTP) private readonly web3Http: Web3,
    @Inject(WEB3_WS) private readonly web3Ws: Web3,
    private readonly history: HistoryStore,
  ) {}

  private lastBlock = 0;
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  async onModuleInit() {
    const tokenAddress = process.env.TOKEN_ADDRESS;
    if (!tokenAddress) throw new Error("TOKEN_ADDRESS is required");

    this.contractHttp = new this.web3Http.eth.Contract(
      ABI as any,
      tokenAddress,
    );

    // Use polling to reliably capture Transfer events (works with any provider)
    this.lastBlock = Number(await this.web3Http.eth.getBlockNumber());
    this.logger.log(`Polling for Transfer events from block ${this.lastBlock}`);

    this.pollInterval = setInterval(() => this.pollTransferEvents(), 2000);
  }

  private async pollTransferEvents() {
    try {
      const latest = Number(await this.web3Http.eth.getBlockNumber());
      if (latest <= this.lastBlock) return;

      const events = await this.contractHttp.getPastEvents("Transfer", {
        fromBlock: this.lastBlock + 1,
        toBlock: "latest",
      });

      for (const ev of events) {
        const { from, to, value } = ev.returnValues;
        this.logger.log(`Transfer: ${from} -> ${to} (${value})`);
        this.history.push({
          txHash: ev.transactionHash,
          from,
          to,
          value: value.toString(),
          blockNumber: Number(ev.blockNumber),
        });
      }

      this.lastBlock = latest;
    } catch (err) {
      this.logger.error("Transfer polling error", err);
    }
  }

  async balanceOf(address: string) {
    const bal: any = await this.contractHttp.methods.balanceOf(address).call();
    return { address, balance: bal.toString() };
  }

  async transfer(fromPk: string, to: string, amount: string) {
    const account = this.web3Http.eth.accounts.privateKeyToAccount(fromPk);
    this.web3Http.eth.accounts.wallet.add(account);

    const tx = this.contractHttp.methods.transfer(to, amount);
    const gas = await tx.estimateGas({ from: account.address });
    const receipt = await tx.send({ from: account.address, gas: gas.toString() });

    return {
      from: account.address,
      to,
      amount,
      txHash: receipt.transactionHash,
    };
  }

  historyList(address?: string) {
    return this.history.list(address);
  }
}
