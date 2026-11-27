import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  const usersRepository = {
    findOneBy: jest.fn(),
    create: jest.fn((user) => user),
    save: jest.fn(),
  };
  const jwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService(usersRepository as never, jwtService as never);
    usersRepository.findOneBy.mockResolvedValue(null);
    jwtService.signAsync.mockResolvedValue('access-token');
    usersRepository.save.mockImplementation(async (user) => user);
  });

  it('does not persist a user when access-token creation fails', async () => {
    jwtService.signAsync.mockRejectedValue(new Error('JWT signing failed'));

    await expect(
      authService.register({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      }),
    ).rejects.toThrow('JWT signing failed');

    expect(usersRepository.save).not.toHaveBeenCalled();
  });

  it('persists the user and returns the authentication response', async () => {
    const response = await authService.register({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    expect(usersRepository.save).toHaveBeenCalledTimes(1);
    expect(response).toEqual({
      accessToken: 'access-token',
      user: {
        id: expect.any(String),
        fullName: 'Test User',
        email: 'test@example.com',
        role: 'tim',
      },
    });
  });
});
