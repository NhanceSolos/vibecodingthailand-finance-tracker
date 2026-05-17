import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionType } from 'shared';
import { CategoryRepository } from './category.repository';
import { CategoryService } from './category.service';

const OWNER_ID = 'user-1';
const OTHER_USER_ID = 'user-2';

const mockCategory = {
  id: 'cat-1',
  name: 'Food',
  icon: '🍔',
  type: TransactionType.EXPENSE,
  userId: OWNER_ID,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockSeedCategory = {
  ...mockCategory,
  id: 'seed-1',
  name: 'Salary',
  type: TransactionType.INCOME,
  userId: null,
};

describe('CategoryService', () => {
  let service: CategoryService;
  let repo: jest.Mocked<CategoryRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: CategoryRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            countTransactions: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    repo = module.get(CategoryRepository);
  });

  describe('findAll', () => {
    it('should return mapped categories for user', async () => {
      repo.findAll.mockResolvedValue([mockSeedCategory, mockCategory]);

      const result = await service.findAll(OWNER_ID);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('seed-1');
      expect(result[1].id).toBe('cat-1');
      expect(repo.findAll).toHaveBeenCalledWith(OWNER_ID, undefined);
    });

    it('should pass type filter to repository', async () => {
      repo.findAll.mockResolvedValue([mockCategory]);

      await service.findAll(OWNER_ID, TransactionType.EXPENSE);

      expect(repo.findAll).toHaveBeenCalledWith(OWNER_ID, TransactionType.EXPENSE);
    });
  });

  describe('create', () => {
    it('should create and return a category', async () => {
      const dto = { name: 'Food', icon: '🍔', type: TransactionType.EXPENSE };
      repo.create.mockResolvedValue(mockCategory);

      const result = await service.create(dto, OWNER_ID);

      expect(result.name).toBe('Food');
      expect(result.userId).toBe(OWNER_ID);
      expect(repo.create).toHaveBeenCalledWith({ ...dto, userId: OWNER_ID });
    });

    it('should throw ConflictException on duplicate name+type', async () => {
      const dto = { name: 'Food', icon: '🍔', type: TransactionType.EXPENSE };
      repo.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.create(dto, OWNER_ID)).rejects.toThrow(ConflictException);
    });

    it('should rethrow unexpected errors', async () => {
      const dto = { name: 'Food', icon: '🍔', type: TransactionType.EXPENSE };
      repo.create.mockRejectedValue(new Error('DB connection failed'));

      await expect(service.create(dto, OWNER_ID)).rejects.toThrow('DB connection failed');
    });
  });

  describe('update', () => {
    it('should update and return the category', async () => {
      const dto = { name: 'Groceries' };
      const updated = { ...mockCategory, name: 'Groceries' };
      repo.findById.mockResolvedValue(mockCategory);
      repo.update.mockResolvedValue(updated);

      const result = await service.update('cat-1', dto, OWNER_ID);

      expect(result.name).toBe('Groceries');
      expect(repo.update).toHaveBeenCalledWith('cat-1', dto);
    });

    it('should throw NotFoundException if category not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.update('missing', {}, OWNER_ID)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for seed default categories', async () => {
      repo.findById.mockResolvedValue(mockSeedCategory);

      await expect(service.update('seed-1', { name: 'Changed' }, OWNER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should throw ForbiddenException when modifying another user's category", async () => {
      repo.findById.mockResolvedValue(mockCategory);

      await expect(service.update('cat-1', { name: 'X' }, OTHER_USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException on duplicate name', async () => {
      repo.findById.mockResolvedValue(mockCategory);
      repo.update.mockRejectedValue({ code: 'P2002' });

      await expect(service.update('cat-1', { name: 'Duplicate' }, OWNER_ID)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should delete the category', async () => {
      repo.findById.mockResolvedValue(mockCategory);
      repo.countTransactions.mockResolvedValue(0);
      repo.delete.mockResolvedValue(mockCategory);

      await service.remove('cat-1', OWNER_ID);

      expect(repo.delete).toHaveBeenCalledWith('cat-1');
    });

    it('should throw NotFoundException if category not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.remove('missing', OWNER_ID)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for seed default categories', async () => {
      repo.findById.mockResolvedValue(mockSeedCategory);

      await expect(service.remove('seed-1', OWNER_ID)).rejects.toThrow(ForbiddenException);
    });

    it("should throw ForbiddenException when deleting another user's category", async () => {
      repo.findById.mockResolvedValue(mockCategory);

      await expect(service.remove('cat-1', OTHER_USER_ID)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when category has transactions', async () => {
      repo.findById.mockResolvedValue(mockCategory);
      repo.countTransactions.mockResolvedValue(3);

      await expect(service.remove('cat-1', OWNER_ID)).rejects.toThrow(ConflictException);
    });
  });
});
