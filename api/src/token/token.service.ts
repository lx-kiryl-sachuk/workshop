import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import Web3 from "web3";
import ABI from "../abi/WorkshopToken.abi.json";
import { WEB3_HTTP } from "../web3/web3.constants";
import { HistoryStore } from "./history.store";

@Injectable()
export class TokenService implements OnModuleInit {
  private readonly logger = new Logger(TokenService.name);
  private contractHttp: any;
  private lastBlock = 0;
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Inject(WEB3_HTTP) private readonly web3Http: Web3,
    private readonly history: HistoryStore,
  ) {}

  async onModuleInit() {
    const tokenAddress = process.env.TOKEN_ADDRESS;
    if (!tokenAddress) throw new Error("TOKEN_ADDRESS is required");

    // TODO: Initialize this.contractHttp using:
    //   new this.web3Http.eth.Contract(ABI as any, tokenAddress)

    // TODO: Store the current block number in this.lastBlock:
    //   this.lastBlock = Number(await this.web3Http.eth.getBlockNumber());

    // TODO: Start polling for Transfer events every 2 seconds:
    //   this.pollInterval = setInterval(() => this.pollTransferEvents(), 2000);
  }

  private async pollTransferEvents() {
    // TODO: Get the latest block number
    //   const latest = Number(await this.web3Http.eth.getBlockNumber());
    //   if (latest <= this.lastBlock) return;

    // TODO: Fetch past Transfer events from this.lastBlock+1 to "latest":
    //   const events = await this.contractHttp.getPastEvents("Transfer", {
    //     fromBlock: this.lastBlock + 1,
    //     toBlock: "latest",
    //   });

    // TODO: Loop through events and push each to this.history:
    //   for (const ev of events) {
    //     const { from, to, value } = ev.returnValues;
    //     this.history.push({ txHash: ev.transactionHash, from, to,
    //       value: value.toString(), blockNumber: Number(ev.blockNumber) });
    //   }

    // TODO: Update this.lastBlock = latest;
  }

  async balanceOf(address: string) {
    // TODO: Call this.contractHttp.methods.balanceOf(address).call()
    // TODO: Return { address, balance: <result as string> }
    return { address, balance: "0" };
  }

  async transfer(fromPk: string, to: string, amount: string) {
    // TODO: Derive account from private key:
    //   const account = this.web3Http.eth.accounts.privateKeyToAccount(fromPk);
    //   this.web3Http.eth.accounts.wallet.add(account);

    // TODO: Build the transfer transaction:
    //   const tx = this.contractHttp.methods.transfer(to, amount);

    // TODO: Estimate gas and send the transaction:
    //   const gas = await tx.estimateGas({ from: account.address });
    //   const receipt = await tx.send({ from: account.address, gas: gas.toString() });

    // TODO: Return { from: account.address, to, amount, txHash: receipt.transactionHash }
    return { from: "", to, amount, txHash: "" };
  }

  historyList(address?: string) {
    return this.history.list(address);
  }
}
