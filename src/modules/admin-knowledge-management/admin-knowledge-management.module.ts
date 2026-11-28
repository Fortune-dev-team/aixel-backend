import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import { AuthModule } from '../auth/auth.module';

import {
  AdminKnowledgeManagementService,
  PRISMA_CLIENT,
} from './admin-knowledge-management.service';

import { AdminKnowledgeManagementController } from './admin-knowledge-management.controller';

@Module({
  imports: [AuthModule],

  controllers: [AdminKnowledgeManagementController],

  providers: [
    AdminKnowledgeManagementService,

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
export class AdminKnowledgeManagementModule {}
