import { Module } from "@nestjs/common";
import Web3 from "web3";
import { WEB3_HTTP } from "./web3.constants";

@Module({
  providers: [
    {
      provide: WEB3_HTTP,
      useFactory: () =>
        new Web3(process.env.RPC_HTTP ?? "http://127.0.0.1:8545"),
    },
  ],
  exports: [WEB3_HTTP],
})
export class Web3Module {}
