import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { QueryFailedError, Repository } from 'typeorm';
import { UserRole } from './enums/user-role.enum';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('Konfirmasi kata sandi tidak cocok');
    }
    if (Buffer.byteLength(registerDto.password, 'utf8') > 72) {
      throw new BadRequestException('Kata sandi maksimal 72 byte');
    }

    const email = registerDto.email.trim().toLowerCase();
    const existingUser = await this.usersRepository.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar');
    }

    const user = this.usersRepository.create({
      id: randomUUID(),
      fullName: registerDto.fullName.trim(),
      email,
      passwordHash: await bcrypt.hash(registerDto.password, 12),
      role: UserRole.TEAM,
    });

    try {
      await this.usersRepository.save(user);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Email sudah terdaftar');
      }
      throw error;
    }

    return this.createAuthResponse(user);
  }

  async login(loginDto: LoginDto) {
    if (Buffer.byteLength(loginDto.password, 'utf8') > 72) {
      throw new UnauthorizedException('Email atau kata sandi salah');
    }

    const email = loginDto.email.trim().toLowerCase();
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();

    if (
      !user ||
      !(await bcrypt.compare(loginDto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Email atau kata sandi salah');
    }

    return this.createAuthResponse(user);
  }

  private async createAuthResponse(user: User) {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: this.toAuthenticatedUser(user),
    };
  }

  private toAuthenticatedUser(user: User): AuthenticatedUser {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      'code' in error.driverError &&
      error.driverError.code === '23505'
    );
  }
}
