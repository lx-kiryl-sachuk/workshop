import { Module } from "@nestjs/common";
import { WEB3_HTTP, WEB3_WS } from "./web3.constants";

// TODO: import Web3

@Module({
  providers: [
    // TODO: Create a provider for WEB3_HTTP
    //   - use `useFactory` to return a new Web3 instance
    //   - connect to process.env.RPC_HTTP (default: "http://127.0.0.1:8545")

    // TODO: Create a provider for WEB3_WS
    //   - use `useFactory` to return a new Web3 instance with a WebSocket provider
    //   - use: new Web3(new Web3.providers.WebsocketProvider(process.env.RPC_WS ?? "ws://127.0.0.1:8545"))
  ],
  exports: [WEB3_HTTP, WEB3_WS],
})
export class Web3Module {}
