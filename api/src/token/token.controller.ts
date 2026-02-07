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
