import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  CreateRecurringDto,
  RecurringResponse,
  TransactionSource,
  TransactionType,
  UpdateRecurringDto,
} from 'shared';
import { CategoryRepository } from '../category/category.repository';
import { TransactionRepository } from '../transaction/transaction.repository';
import { RecurringRepository } from './recurring.repository';

type PrismaRecurring = Awaited<ReturnType<RecurringRepository['findById']>>;

@Injectable()
export class RecurringService {
  private readonly logger = new Logger(RecurringService.name);

  constructor(
    private readonly recurringRepository: RecurringRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async findAll(userId: string): Promise<RecurringResponse[]> {
    const items = await this.recurringRepository.findAll(userId);
    return items.map((item) => this.toResponse(item));
  }

  async create(dto: CreateRecurringDto, userId: string): Promise<RecurringResponse> {
    await this.validateCategory(dto.categoryId, dto.type, userId);
    const item = await this.recurringRepository.create({ ...dto, userId });
    return this.toResponse(item);
  }

  async update(id: string, dto: UpdateRecurringDto, userId: string): Promise<RecurringResponse> {
    const existing = await this.recurringRepository.findById(id);
    if (!existing) throw new NotFoundException('Recurring not found');
    if (existing.userId !== userId) throw new ForbiddenException('Cannot modify another user\'s recurring');

    if (dto.categoryId) {
      await this.validateCategory(dto.categoryId, existing.type as TransactionType, userId);
    }

    const updated = await this.recurringRepository.update(id, dto);
    return this.toResponse(updated);
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.recurringRepository.findById(id);
    if (!existing) throw new NotFoundException('Recurring not found');
    if (existing.userId !== userId) throw new ForbiddenException('Cannot delete another user\'s recurring');
    await this.recurringRepository.delete(id);
  }

  @Cron('0 1 0 * * *')
  async processRecurring() {
    const dayOfMonth = new Date().getDate();
    const due = await this.recurringRepository.findDueToday(dayOfMonth);

    this.logger.log(`Processing ${due.length} recurring transactions for day ${dayOfMonth}`);

    for (const item of due) {
      try {
        await this.transactionRepository.create({
          amount: Number(item.amount),
          type: item.type as TransactionType,
          description: item.description,
          categoryId: item.categoryId,
          userId: item.userId,
          source: TransactionSource.RECURRING,
        });
        await this.recurringRepository.markExecuted(item.id);
      } catch (err) {
        this.logger.error(`Failed to process recurring ${item.id}`, err);
      }
    }
  }

  private async validateCategory(categoryId: string, type: TransactionType, userId: string) {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) throw new NotFoundException('Category not found');
    if (category.userId !== null && category.userId !== userId) {
      throw new ForbiddenException('Category does not belong to user');
    }
    if (category.type !== type) {
      throw new BadRequestException('Category type must match recurring type');
    }
  }

  private toResponse(item: NonNullable<PrismaRecurring>): RecurringResponse {
    return {
      id: item.id,
      amount: Number(item.amount),
      type: item.type as TransactionType,
      description: item.description,
      dayOfMonth: item.dayOfMonth,
      active: item.active,
      categoryId: item.categoryId,
      category: item.category,
      userId: item.userId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
