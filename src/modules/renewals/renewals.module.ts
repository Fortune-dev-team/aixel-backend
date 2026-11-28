import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import { AuthModule } from '../auth/auth.module';

import { RenewalsService, PRISMA_CLIENT } from './renewals.service';
import { RenewalsController } from './renewals.controller';

@Module({
  imports: [AuthModule],
  controllers: [RenewalsController],
  providers: [
    RenewalsService,
    {
      provide: PRISMA_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new PrismaClient({
          adapter: new PrismaPg({
            connectionString: config.getOrThrow<string>('DATABASE_URL'),
          }),
        }),
    },
  ],
  exports: [RenewalsService],
})
export class RenewalsModule {}
