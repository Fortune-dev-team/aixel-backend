import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

describe('AuthService', () => {
  describe('register', () => {
    it('sets updatedAt when creating a user', async () => {
      const usersRepository = {
        findOneBy: jest.fn().mockResolvedValue(null),
        create: jest.fn((user: Partial<User>) => user as User),
        save: jest.fn((user: User) => Promise.resolve(user)),
      } as unknown as Repository<User>;
      const jwtService = {
        signAsync: jest.fn().mockResolvedValue('access-token'),
      } as unknown as JwtService;
      const service = new AuthService(usersRepository, jwtService);

      await service.register({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      } satisfies RegisterDto);

      expect(usersRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          updatedAt: expect.any(Date),
        }),
      );
    });
  });
});
