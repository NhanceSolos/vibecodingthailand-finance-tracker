import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionType } from 'shared';
import { RecurringRepository } from './recurring.repository';
import { RecurringService } from './recurring.service';
import { CategoryRepository } from '../category/category.repository';
import { TransactionRepository } from '../transaction/transaction.repository';

const mockCategory = { id: 'cat1', name: 'Food', icon: '🍔', type: TransactionType.EXPENSE, userId: 'user1', createdAt: new Date(), updatedAt: new Date() };
const mockRecurring = {
  id: 'rec1',
  amount: { toString: () => '1000', toNumber: () => 1000, valueOf: () => 1000 } as unknown as { toString(): string; toNumber(): number; valueOf(): number },
  type: TransactionType.EXPENSE,
  description: 'ค่าเช่า',
  dayOfMonth: 1,
  active: true,
  lastExecutedAt: null,
  categoryId: 'cat1',
  category: { id: 'cat1', name: 'Food', icon: '🍔' },
  userId: 'user1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRecurringRepo = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findDueToday: jest.fn(),
  markExecuted: jest.fn(),
};

const mockTransactionRepo = {
  create: jest.fn(),
};

const mockCategoryRepo = {
  findById: jest.fn(),
};

describe('RecurringService', () => {
  let service: RecurringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurringService,
        { provide: RecurringRepository, useValue: mockRecurringRepo },
        { provide: TransactionRepository, useValue: mockTransactionRepo },
        { provide: CategoryRepository, useValue: mockCategoryRepo },
      ],
    }).compile();

    service = module.get<RecurringService>(RecurringService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns mapped recurring list', async () => {
      mockRecurringRepo.findAll.mockResolvedValue([mockRecurring]);
      const result = await service.findAll('user1');
      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe(1000);
      expect(result[0].description).toBe('ค่าเช่า');
    });
  });

  describe('create', () => {
    it('creates recurring when category is valid', async () => {
      mockCategoryRepo.findById.mockResolvedValue(mockCategory);
      mockRecurringRepo.create.mockResolvedValue(mockRecurring);
      const dto = { amount: 1000, type: TransactionType.EXPENSE, description: 'ค่าเช่า', categoryId: 'cat1', dayOfMonth: 1 };
      const result = await service.create(dto, 'user1');
      expect(result.id).toBe('rec1');
      expect(mockRecurringRepo.create).toHaveBeenCalledWith({ ...dto, userId: 'user1' });
    });

    it('throws NotFoundException when category not found', async () => {
      mockCategoryRepo.findById.mockResolvedValue(null);
      await expect(
        service.create({ amount: 100, type: TransactionType.EXPENSE, description: 'test', categoryId: 'bad', dayOfMonth: 1 }, 'user1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when category type mismatches', async () => {
      mockCategoryRepo.findById.mockResolvedValue({ ...mockCategory, type: TransactionType.INCOME });
      await expect(
        service.create({ amount: 100, type: TransactionType.EXPENSE, description: 'test', categoryId: 'cat1', dayOfMonth: 1 }, 'user1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('updates recurring for owner', async () => {
      mockRecurringRepo.findById.mockResolvedValue(mockRecurring);
      mockRecurringRepo.update.mockResolvedValue({ ...mockRecurring, active: false });
      const result = await service.update('rec1', { active: false }, 'user1');
      expect(result.active).toBe(false);
    });

    it('throws NotFoundException when recurring not found', async () => {
      mockRecurringRepo.findById.mockResolvedValue(null);
      await expect(service.update('bad', { active: false }, 'user1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException for wrong user', async () => {
      mockRecurringRepo.findById.mockResolvedValue(mockRecurring);
      await expect(service.update('rec1', { active: false }, 'other')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('deletes recurring for owner', async () => {
      mockRecurringRepo.findById.mockResolvedValue(mockRecurring);
      mockRecurringRepo.delete.mockResolvedValue(undefined);
      await expect(service.remove('rec1', 'user1')).resolves.toBeUndefined();
    });

    it('throws ForbiddenException for wrong user', async () => {
      mockRecurringRepo.findById.mockResolvedValue(mockRecurring);
      await expect(service.remove('rec1', 'other')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('processRecurring', () => {
    it('creates transactions for due items', async () => {
      mockRecurringRepo.findDueToday.mockResolvedValue([mockRecurring]);
      mockTransactionRepo.create.mockResolvedValue({});
      mockRecurringRepo.markExecuted.mockResolvedValue({});
      await service.processRecurring();
      expect(mockTransactionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'RECURRING', userId: 'user1' }),
      );
      expect(mockRecurringRepo.markExecuted).toHaveBeenCalledWith('rec1');
    });

    it('skips failed items and continues', async () => {
      const second = { ...mockRecurring, id: 'rec2' };
      mockRecurringRepo.findDueToday.mockResolvedValue([mockRecurring, second]);
      mockTransactionRepo.create.mockRejectedValueOnce(new Error('DB error')).mockResolvedValue({});
      mockRecurringRepo.markExecuted.mockResolvedValue({});
      await service.processRecurring();
      expect(mockRecurringRepo.markExecuted).toHaveBeenCalledTimes(1);
      expect(mockRecurringRepo.markExecuted).toHaveBeenCalledWith('rec2');
    });
  });
});
