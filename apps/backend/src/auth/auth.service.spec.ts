import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  password: '',
  lineUserId: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('AuthService', () => {
  let service: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    authRepository = module.get(AuthRepository);
    jwtService = module.get(JwtService);
  });

  describe('register', () => {
    it('should register a new user and return auth response', async () => {
      const dto = { email: 'test@example.com', password: 'password123', name: 'Test User' };
      const createdUser = { ...mockUser, email: dto.email, name: dto.name };

      authRepository.findByEmail.mockResolvedValue(null);
      authRepository.create.mockResolvedValue(createdUser);

      const result = await service.register(dto);

      expect(result.accessToken).toBe('mock-token');
      expect(result.user.email).toBe(dto.email);
      expect(result.user.name).toBe(dto.name);
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: createdUser.id, email: createdUser.email });
    });

    it('should hash the password before creating', async () => {
      const dto = { email: 'test@example.com', password: 'password123', name: 'Test User' };
      authRepository.findByEmail.mockResolvedValue(null);
      authRepository.create.mockResolvedValue(mockUser);

      await service.register(dto);

      const createCall = authRepository.create.mock.calls[0][0];
      expect(createCall.password).not.toBe(dto.password);
      const isHashed = await bcrypt.compare(dto.password, createCall.password);
      expect(isHashed).toBe(true);
    });

    it('should throw ConflictException if email already exists', async () => {
      authRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register({ email: 'test@example.com', password: 'password123', name: 'Test' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login and return auth response', async () => {
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      const userWithHash = { ...mockUser, password: hashedPassword };

      authRepository.findByEmail.mockResolvedValue(userWithHash);

      const result = await service.login({ email: mockUser.email, password });

      expect(result.accessToken).toBe('mock-token');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      authRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'notfound@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      authRepository.findByEmail.mockResolvedValue({ ...mockUser, password: hashedPassword });

      await expect(
        service.login({ email: mockUser.email, password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      authRepository.findById.mockResolvedValue(mockUser);

      const result = await service.getProfile(mockUser.id);

      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result.name).toBe(mockUser.name);
      expect(result.createdAt).toEqual(mockUser.createdAt);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      authRepository.findById.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent-id')).rejects.toThrow(UnauthorizedException);
    });
  });
});
