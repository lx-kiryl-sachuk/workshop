import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Web3 from 'web3';
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

    // TODO: Initialize contractHttp and contractWs instances

    // TODO: Subscribe to Transfer events via WebSocket (web3.js v4 API)
  }

  async balanceOf(address: string) {
    // TODO: Call this.contractHttp.methods.balanceOf(address).call()

    return { address, balance: '0' };
  }

  async transfer(fromPk: string, to: string, amount: string) {
    // TODO: Derive account from private key

    // TODO: Build the transfer transaction

    // TODO: Estimate gas and send the transaction

    return { from: '', to, amount, txHash: '' };
  }

  historyList(address?: string) {
    return this.history.list(address);
  }
}
