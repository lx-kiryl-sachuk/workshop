import { Module } from '@nestjs/common';
import { WEB3_HTTP, WEB3_WS } from './web3.constants';

// TODO: import Web3

@Module({
  providers: [
    // TODO: Create a provider for WEB3_HTTP
    // TODO: Create a provider for WEB3_WS
  ],
  exports: [WEB3_HTTP, WEB3_WS],
})
export class Web3Module {}
