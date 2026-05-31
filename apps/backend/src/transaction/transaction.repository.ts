import { Injectable } from '@nestjs/common';
import { TransactionSource, TransactionType } from 'shared';
import { PrismaService } from '../prisma/prisma.service';

const CATEGORY_SELECT = { id: true, name: true, icon: true } as const;

export interface TransactionFilter {
  page: number;
  limit: number;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  type?: TransactionType;
}

@Injectable()
export class TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    amount: number;
    type: TransactionType;
    description?: string;
    categoryId: string;
    userId: string;
    source?: TransactionSource;
  }) {
    return this.prisma.transaction.create({
      data,
      include: { category: { select: CATEGORY_SELECT } },
    });
  }

  async findAll(userId: string, filter: TransactionFilter) {
    const { page, limit, startDate, endDate, categoryId, type } = filter;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(startDate && endDate && {
        createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
      }),
      ...(categoryId && { categoryId }),
      ...(type && { type }),
    };

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: { category: { select: CATEGORY_SELECT } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string) {
    return this.prisma.transaction.findUnique({
      where: { id },
      include: { category: { select: CATEGORY_SELECT } },
    });
  }

  async update(
    id: string,
    data: { amount?: number; type?: TransactionType; description?: string; categoryId?: string },
  ) {
    return this.prisma.transaction.update({
      where: { id },
      data,
      include: { category: { select: CATEGORY_SELECT } },
    });
  }

  async delete(id: string) {
    return this.prisma.transaction.delete({ where: { id } });
  }

  async findForSummary(userId: string, startDate: Date, endDate: Date) {
    return this.prisma.transaction.findMany({
      where: { userId, createdAt: { gte: startDate, lte: endDate } },
      include: { category: { select: CATEGORY_SELECT } },
    });
  }
}
