import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import { AuthModule } from '../auth/auth.module';

import { DashboardsController } from './dashboards.controller';
import { DashboardsService, PRISMA_CLIENT } from './dashboards.service';

@Module({
  imports: [AuthModule],

  controllers: [DashboardsController],

  providers: [
    DashboardsService,

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
export class DashboardsModule {}
