import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CategoryBreakdown,
  CreateTransactionDto,
  DailyTotal,
  GetTransactionsQueryDto,
  PaginatedTransactionsResponse,
  TransactionResponse,
  TransactionSummaryResponse,
  TransactionType,
  UpdateTransactionDto,
} from 'shared';
import { CategoryRepository } from '../category/category.repository';
import { TransactionFilter, TransactionRepository } from './transaction.repository';

type PrismaTransaction = Awaited<ReturnType<TransactionRepository['findById']>>;

@Injectable()
export class TransactionService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async create(dto: CreateTransactionDto, userId: string): Promise<TransactionResponse> {
    await this.validateCategory(dto.categoryId, dto.type, userId);
    const tx = await this.transactionRepository.create({ ...dto, userId });
    return this.toResponse(tx!);
  }

  async findAll(
    userId: string,
    query: GetTransactionsQueryDto,
  ): Promise<PaginatedTransactionsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filter: TransactionFilter = {
      page,
      limit,
      startDate: query.startDate,
      endDate: query.endDate,
      categoryId: query.categoryId,
      type: query.type,
    };

    const { data, total } = await this.transactionRepository.findAll(userId, filter);

    return {
      data: data.map((tx) => this.toResponse(tx)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSummary(userId: string, month?: number, year?: number): Promise<TransactionSummaryResponse> {
    const now = new Date();
    const targetMonth = month ?? now.getMonth() + 1;
    const targetYear = year ?? now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const transactions = await this.transactionRepository.findForSummary(userId, startDate, endDate);

    return this.computeSummary(transactions);
  }

  async update(id: string, dto: UpdateTransactionDto, userId: string): Promise<TransactionResponse> {
    const existing = await this.transactionRepository.findById(id);
    if (!existing) throw new NotFoundException('Transaction not found');
    if (existing.userId !== userId) throw new ForbiddenException('Cannot modify another user\'s transaction');

    if (dto.categoryId || dto.type) {
      const resolvedCategoryId = dto.categoryId ?? existing.categoryId;
      const resolvedType = dto.type ?? (existing.type as TransactionType);
      await this.validateCategory(resolvedCategoryId, resolvedType, userId);
    }

    const updated = await this.transactionRepository.update(id, dto);
    return this.toResponse(updated!);
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.transactionRepository.findById(id);
    if (!existing) throw new NotFoundException('Transaction not found');
    if (existing.userId !== userId) throw new ForbiddenException('Cannot delete another user\'s transaction');

    await this.transactionRepository.delete(id);
  }

  private async validateCategory(categoryId: string, type: TransactionType, userId: string) {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) throw new NotFoundException('Category not found');
    if (category.userId !== null && category.userId !== userId) {
      throw new ForbiddenException('Category does not belong to user');
    }
    if (category.type !== type) {
      throw new BadRequestException('Category type must match transaction type');
    }
  }

  private computeSummary(
    transactions: NonNullable<Awaited<ReturnType<TransactionRepository['findForSummary']>>>,
  ): TransactionSummaryResponse {
    let totalIncome = 0;
    let totalExpense = 0;
    const expenseMap = new Map<string, CategoryBreakdown>();
    const incomeMap = new Map<string, CategoryBreakdown>();
    const dailyMap = new Map<string, { income: number; expense: number }>();

    for (const tx of transactions) {
      const amount = Number(tx.amount);
      const dateStr = tx.createdAt.toISOString().split('T')[0];
      const daily = dailyMap.get(dateStr) ?? { income: 0, expense: 0 };

      if (tx.type === TransactionType.INCOME) {
        totalIncome += amount;
        this.accumulate(incomeMap, tx.category, amount);
        dailyMap.set(dateStr, { ...daily, income: daily.income + amount });
      } else {
        totalExpense += amount;
        this.accumulate(expenseMap, tx.category, amount);
        dailyMap.set(dateStr, { ...daily, expense: daily.expense + amount });
      }
    }

    const toArray = (map: Map<string, CategoryBreakdown>, total: number): CategoryBreakdown[] =>
      [...map.values()]
        .map((item) => ({
          ...item,
          percentage: total > 0 ? Math.round((item.total / total) * 1000) / 10 : 0,
        }))
        .sort((a, b) => b.total - a.total);

    const dailyTotals: DailyTotal[] = [...dailyMap.entries()]
      .map(([date, totals]) => ({ date, ...totals }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      balance: Math.round((totalIncome - totalExpense) * 100) / 100,
      byCategoryExpense: toArray(expenseMap, totalExpense),
      byCategoryIncome: toArray(incomeMap, totalIncome),
      dailyTotals,
    };
  }

  private accumulate(
    map: Map<string, CategoryBreakdown>,
    category: { id: string; name: string; icon: string },
    amount: number,
  ) {
    const existing = map.get(category.id);
    if (existing) {
      existing.total += amount;
    } else {
      map.set(category.id, {
        categoryId: category.id,
        name: category.name,
        icon: category.icon,
        total: amount,
        percentage: 0,
      });
    }
  }

  private toResponse(tx: NonNullable<PrismaTransaction>): TransactionResponse {
    return {
      id: tx.id,
      amount: Number(tx.amount),
      type: tx.type as TransactionType,
      description: tx.description,
      source: tx.source as TransactionResponse['source'],
      categoryId: tx.categoryId,
      category: tx.category,
      userId: tx.userId,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt,
    };
  }
}
