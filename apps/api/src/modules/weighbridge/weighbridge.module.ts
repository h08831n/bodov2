import { Module } from '@nestjs/common';
import { WeighbridgeService } from './weighbridge.service';
import { WeighbridgeController } from './weighbridge.controller';

@Module({
  controllers: [WeighbridgeController],
  providers: [WeighbridgeService],
  exports: [WeighbridgeService],
})
export class WeighbridgeModule {}
