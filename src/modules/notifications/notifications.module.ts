import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import { AuthModule } from '../auth/auth.module';

import { NotificationsService, PRISMA_CLIENT } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [AuthModule],

  controllers: [NotificationsController],

  providers: [
    NotificationsService,

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

  exports: [NotificationsService],
})
export class NotificationsModule {}
