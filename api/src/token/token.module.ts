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
