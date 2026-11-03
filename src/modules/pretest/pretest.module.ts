import { Module } from '@nestjs/common';
import { PretestController } from './pretest.controller';
import { PretestService } from './pretest.service';

@Module({
  controllers: [PretestController],
  providers: [PretestService]
})
export class PretestModule {}
