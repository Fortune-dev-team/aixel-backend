import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import { AuthModule } from '../auth/auth.module';

import { CertificatesService, PRISMA_CLIENT } from './certificates.service';
import { CertificatesController } from './certificates.controller';

@Module({
  imports: [AuthModule],
  controllers: [CertificatesController],
  providers: [
    CertificatesService,
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
  exports: [CertificatesService],
})
export class CertificatesModule {}
