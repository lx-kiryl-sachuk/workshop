import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { TokenModule } from './token/token.module';

@Module({
  imports: [HealthModule, TokenModule],
})
export class AppModule {}
