import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { normalizeUserRole } from '../enums/user-role.enum';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { User } from '../../users/entities/user.entity';

interface JwtPayload {
  sub: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersRepository.findOneBy({ id: payload.sub });
    if (!user) {
      throw new UnauthorizedException();
    }

    const role = normalizeUserRole(user.role);
    if (typeof user.fullName !== 'string' || role === null) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role,
    };
  }
}
