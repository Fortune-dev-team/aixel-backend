import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';

import { InterventionsController } from './interventions.controller';
import { InterventionsService, PRISMA_CLIENT } from './interventions.service';

@Module({
  imports: [AuthModule, AuditModule],

  controllers: [InterventionsController],

  providers: [
    InterventionsService,

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
export class InterventionsModule {}
