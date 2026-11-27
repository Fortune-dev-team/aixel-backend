import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { AuthModule } from '../auth/auth.module';
import { AdminLevelsController } from './admin-levels.controller';
import { AdminLevelsService } from './admin-levels.service';
import { AdminAttributeCategoriesController } from './admin-attribute-categories.controller';
import { AdminAttributeCategoriesService } from './admin-attribute-categories.service';
import { AdminAttributesController } from './admin-attributes.controller';
import { AdminAttributesService } from './admin-attributes.service';
import { AttributeCategoriesController } from './attribute-categories.controller';
import { AttributesController } from './attributes.controller';
import { AttributesService, PRISMA_CLIENT } from './attributes.service';

@Module({
  imports: [AuthModule],
  controllers: [
    AttributesController,
    AttributeCategoriesController,
    AdminAttributesController,
    AdminAttributeCategoriesController,
    AdminLevelsController,
  ],
  providers: [
    AttributesService,
    AdminAttributesService,
    AdminAttributeCategoriesService,
    AdminLevelsService,
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
export class AttributesModule {}
