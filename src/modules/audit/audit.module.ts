import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import { AuthModule } from '../auth/auth.module';

import { AuditController, AuditExportsController } from './audit.controller';
import { AuditService, PRISMA_CLIENT } from './audit.service';

@Module({
  imports: [AuthModule],

  controllers: [AuditController, AuditExportsController],

  providers: [
    AuditService,

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

  exports: [AuditService],
})
export class AuditModule {}
