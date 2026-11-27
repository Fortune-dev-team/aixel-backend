import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { AuthModule } from '../auth/auth.module';
import { PretestController } from './pretest.controller';
import { PretestService, PRISMA_CLIENT } from './pretest.service';

@Module({
  imports: [AuthModule],
  controllers: [PretestController],
  providers: [
    PretestService,
    // SEMENTARA: ganti ke PrismaService setelah disepakati dengan Dev 1.
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
export class PretestModule {}
