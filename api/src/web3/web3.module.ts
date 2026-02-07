import { Module } from '@nestjs/common';
import Web3 from 'web3';
import { WEB3_HTTP, WEB3_WS } from './web3.constants';

@Module({
  providers: [
    {
      provide: WEB3_HTTP,
      useFactory: () =>
        new Web3(process.env.RPC_HTTP ?? 'http://127.0.0.1:8545'),
    },
    {
      provide: WEB3_WS,
      useFactory: () =>
        new Web3(
          new Web3.providers.WebsocketProvider(
            process.env.RPC_WS ?? 'ws://127.0.0.1:8545',
          ),
        ),
    },
  ],
  exports: [WEB3_HTTP, WEB3_WS],
})
export class Web3Module {}
