import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionType } from 'shared';
import { CategoryRepository } from '../category/category.repository';
import { TransactionRepository } from './transaction.repository';
import { TransactionService } from './transaction.service';

const USER_ID = 'user-1';
const OTHER_USER_ID = 'user-2';

const mockCategory = {
  id: 'cat-1',
  name: 'Food',
  icon: '🍔',
  type: TransactionType.EXPENSE,
  userId: USER_ID,
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

const mockTransaction = {
  id: 'tx-1',
  amount: { valueOf: () => 100, toNumber: () => 100 } as unknown as number,
  type: TransactionType.EXPENSE,
  description: 'Lunch',
  source: 'WEB',
  categoryId: 'cat-1',
  category: { id: 'cat-1', name: 'Food', icon: '🍔' },
  userId: USER_ID,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
};

describe('TransactionService', () => {
  let service: TransactionService;
  let txRepo: jest.Mocked<TransactionRepository>;
  let catRepo: jest.Mocked<CategoryRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: TransactionRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findForSummary: jest.fn(),
          },
        },
        {
          provide: CategoryRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    txRepo = module.get(TransactionRepository);
    catRepo = module.get(CategoryRepository);
  });

  describe('create', () => {
    it('should create a transaction when category is valid', async () => {
      const dto = { amount: 100, type: TransactionType.EXPENSE, categoryId: 'cat-1' };
      catRepo.findById.mockResolvedValue(mockCategory);
      txRepo.create.mockResolvedValue(mockTransaction as never);

      const result = await service.create(dto, USER_ID);

      expect(result.amount).toBe(100);
      expect(result.userId).toBe(USER_ID);
      expect(txRepo.create).toHaveBeenCalledWith({ ...dto, userId: USER_ID });
    });

    it('should allow seed default categories (userId=null)', async () => {
      const dto = { amount: 500, type: TransactionType.INCOME, categoryId: 'seed-1' };
      catRepo.findById.mockResolvedValue(mockSeedCategory);
      txRepo.create.mockResolvedValue({ ...mockTransaction, type: TransactionType.INCOME, categoryId: 'seed-1' } as never);

      await expect(service.create(dto, USER_ID)).resolves.toBeDefined();
    });

    it('should throw NotFoundException when category does not exist', async () => {
      catRepo.findById.mockResolvedValue(null);

      await expect(
        service.create({ amount: 100, type: TransactionType.EXPENSE, categoryId: 'bad-id' }, USER_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when category belongs to another user', async () => {
      catRepo.findById.mockResolvedValue({ ...mockCategory, userId: OTHER_USER_ID });

      await expect(
        service.create({ amount: 100, type: TransactionType.EXPENSE, categoryId: 'cat-1' }, USER_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when category type does not match transaction type', async () => {
      catRepo.findById.mockResolvedValue(mockCategory); // EXPENSE category

      await expect(
        service.create({ amount: 500, type: TransactionType.INCOME, categoryId: 'cat-1' }, USER_ID),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated transactions', async () => {
      txRepo.findAll.mockResolvedValue({ data: [mockTransaction as never], total: 1 });

      const result = await service.findAll(USER_ID, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should compute totalPages correctly', async () => {
      txRepo.findAll.mockResolvedValue({ data: [], total: 45 });

      const result = await service.findAll(USER_ID, { page: 1, limit: 20 });

      expect(result.totalPages).toBe(3);
    });
  });

  describe('getSummary', () => {
    it('should compute summary correctly', async () => {
      const incomeTransaction = {
        ...mockTransaction,
        id: 'tx-income',
        type: TransactionType.INCOME,
        amount: { valueOf: () => 1000 } as never,
        category: { id: 'seed-1', name: 'Salary', icon: '💰' },
      };
      const expenseTransaction = {
        ...mockTransaction,
        type: TransactionType.EXPENSE,
        amount: { valueOf: () => 300 } as never,
      };

      txRepo.findForSummary.mockResolvedValue([incomeTransaction, expenseTransaction] as never);

      const result = await service.getSummary(USER_ID, 1, 2024);

      expect(result.totalIncome).toBe(1000);
      expect(result.totalExpense).toBe(300);
      expect(result.balance).toBe(700);
      expect(result.byCategoryExpense).toHaveLength(1);
      expect(result.byCategoryIncome).toHaveLength(1);
      expect(result.byCategoryExpense[0].percentage).toBe(100);
    });

    it('should return zero summary when no transactions', async () => {
      txRepo.findForSummary.mockResolvedValue([]);

      const result = await service.getSummary(USER_ID, 1, 2024);

      expect(result.totalIncome).toBe(0);
      expect(result.totalExpense).toBe(0);
      expect(result.balance).toBe(0);
      expect(result.dailyTotals).toHaveLength(0);
    });

    it('should group multiple transactions of same category', async () => {
      const tx1 = { ...mockTransaction, id: 'tx-1', amount: { valueOf: () => 100 } as never };
      const tx2 = { ...mockTransaction, id: 'tx-2', amount: { valueOf: () => 200 } as never };
      txRepo.findForSummary.mockResolvedValue([tx1, tx2] as never);

      const result = await service.getSummary(USER_ID, 1, 2024);

      expect(result.byCategoryExpense).toHaveLength(1);
      expect(result.byCategoryExpense[0].total).toBe(300);
    });
  });

  describe('update', () => {
    it('should update a transaction', async () => {
      const dto = { amount: 150 };
      const updated = { ...mockTransaction, amount: { valueOf: () => 150 } as never };
      txRepo.findById.mockResolvedValue(mockTransaction as never);
      txRepo.update.mockResolvedValue(updated as never);

      const result = await service.update('tx-1', dto, USER_ID);

      expect(result.amount).toBe(150);
    });

    it('should throw NotFoundException if transaction not found', async () => {
      txRepo.findById.mockResolvedValue(null);

      await expect(service.update('missing', {}, USER_ID)).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException when updating another user's transaction", async () => {
      txRepo.findById.mockResolvedValue(mockTransaction as never);

      await expect(service.update('tx-1', {}, OTHER_USER_ID)).rejects.toThrow(ForbiddenException);
    });

    it('should validate new category when categoryId changes', async () => {
      const dto = { categoryId: 'bad-cat' };
      txRepo.findById.mockResolvedValue(mockTransaction as never);
      catRepo.findById.mockResolvedValue(null);

      await expect(service.update('tx-1', dto, USER_ID)).rejects.toThrow(NotFoundException);
    });

    it('should validate category type when type changes', async () => {
      const dto = { type: TransactionType.INCOME };
      txRepo.findById.mockResolvedValue(mockTransaction as never);
      catRepo.findById.mockResolvedValue(mockCategory); // EXPENSE category

      await expect(service.update('tx-1', dto, USER_ID)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete a transaction', async () => {
      txRepo.findById.mockResolvedValue(mockTransaction as never);
      txRepo.delete.mockResolvedValue(mockTransaction as never);

      await expect(service.remove('tx-1', USER_ID)).resolves.toBeUndefined();
      expect(txRepo.delete).toHaveBeenCalledWith('tx-1');
    });

    it('should throw NotFoundException if transaction not found', async () => {
      txRepo.findById.mockResolvedValue(null);

      await expect(service.remove('missing', USER_ID)).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException when deleting another user's transaction", async () => {
      txRepo.findById.mockResolvedValue(mockTransaction as never);

      await expect(service.remove('tx-1', OTHER_USER_ID)).rejects.toThrow(ForbiddenException);
    });
  });
});
