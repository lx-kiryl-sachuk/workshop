import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Web3 from 'web3';
import ABI from '../abi/WorkshopToken.abi.json';
import { WEB3_HTTP, WEB3_WS } from '../web3/web3.constants';
import { HistoryStore } from './history.store';

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

  onModuleInit() {
    const tokenAddress = process.env.TOKEN_ADDRESS;
    if (!tokenAddress) throw new Error('TOKEN_ADDRESS is required');

    // TODO: Initialize this.contractHttp using:
    //   new this.web3Http.eth.Contract(ABI as any, tokenAddress)

    // TODO: Initialize this.contractWs the same way but with this.web3Ws

    // TODO: Subscribe to Transfer events via WebSocket (web3.js v4 API):
    //   const subscription = this.contractWs.events.Transfer();
    //
    //   subscription.on("data", (ev: any) => {
    //     const { from, to, value } = ev.returnValues;
    //     this.history.push({
    //       txHash: ev.transactionHash, from, to,
    //       value: value.toString(), blockNumber: Number(ev.blockNumber),
    //     });
    //   });
    //
    //   subscription.on("error", (err: any) =>
    //     this.logger.error("Transfer subscription error", err),
    //   );
  }

  async balanceOf(address: string) {
    // TODO: Call this.contractHttp.methods.balanceOf(address).call()
    // TODO: Return { address, balance: <result as string> }
    return { address, balance: '0' };
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
    return { from: '', to, amount, txHash: '' };
  }

  historyList(address?: string) {
    return this.history.list(address);
  }
}
