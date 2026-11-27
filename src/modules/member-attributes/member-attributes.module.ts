import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { AuthModule } from '../auth/auth.module';
import { MemberAttributesController } from './member-attributes.controller';
import { MemberAttributesService, PRISMA_CLIENT } from './member-attributes.service';
import { ProfileController } from './profile.controller';

@Module({
  imports: [AuthModule],
  controllers: [MemberAttributesController, ProfileController],
  providers: [
    MemberAttributesService,
    // SEMENTARA: ganti ke PrismaService setelah disepakati dengan Dev 1. Jangan di-push sebagai final.
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
export class MemberAttributesModule {}
