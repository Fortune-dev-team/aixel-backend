import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import { AuthModule } from '../auth/auth.module';

import { RulesController } from './rules.controller';
import { RulesService, PRISMA_CLIENT } from './rules.service';

@Module({
  imports: [AuthModule],

  controllers: [RulesController],

  providers: [
    RulesService,

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
})
export class RulesModule {}
