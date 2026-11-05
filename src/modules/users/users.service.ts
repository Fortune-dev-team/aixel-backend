import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
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

    return users.map(({ id, fullName, email, role }) => ({
      id,
      fullName,
      email,
      role,
    }));
  }
}
