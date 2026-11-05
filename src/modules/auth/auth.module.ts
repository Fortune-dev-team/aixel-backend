import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from '../users/entities/user.entity';

function getAccessTokenTtl(configService: ConfigService): number {
  const ttl = configService.get<string>('JWT_ACCESS_TTL') ?? '15m';
  const match = /^(\d+)(s|m|h|d)$/.exec(ttl);
  const unitSeconds: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };
  const multiplier = match ? unitSeconds[match[2]] : undefined;

  if (!match || !multiplier) {
    throw new Error(
      'JWT_ACCESS_TTL harus menggunakan format angka diikuti s, m, h, atau d',
    );
  }

  return Number(match[1]) * multiplier;
}

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: getAccessTokenTtl(configService),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, RolesGuard],
  exports: [JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
