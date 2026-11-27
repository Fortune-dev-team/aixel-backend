import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { normalizeUserRole } from '../auth/enums/user-role.enum';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<AuthenticatedUser[]> {
    const users = await this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });

    return users.map(({ id, fullName, email, role }) => {
      const normalizedRole = normalizeUserRole(role);
      if (typeof fullName !== 'string' || normalizedRole === null) {
        throw new InternalServerErrorException(
          'Data pengguna tidak lengkap untuk autentikasi',
        );
      }

      return {
        id,
        fullName,
        email,
        role: normalizedRole,
      };
    });
  }
}
