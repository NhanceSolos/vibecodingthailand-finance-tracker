import { Injectable } from '@nestjs/common';
import { TransactionType } from 'shared';
import { PrismaService } from '../prisma/prisma.service';

const CATEGORY_SELECT = { id: true, name: true, icon: true } as const;

@Injectable()
export class RecurringRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.recurring.findMany({
      where: { userId },
      include: { category: { select: CATEGORY_SELECT } },
      orderBy: { dayOfMonth: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.recurring.findUnique({
      where: { id },
      include: { category: { select: CATEGORY_SELECT } },
    });
  }

  create(data: {
    amount: number;
    type: TransactionType;
    description: string;
    categoryId: string;
    userId: string;
    dayOfMonth: number;
  }) {
    return this.prisma.recurring.create({
      data,
      include: { category: { select: CATEGORY_SELECT } },
    });
  }

  update(
    id: string,
    data: {
      amount?: number;
      description?: string;
      categoryId?: string;
      dayOfMonth?: number;
      active?: boolean;
    },
  ) {
    return this.prisma.recurring.update({
      where: { id },
      data,
      include: { category: { select: CATEGORY_SELECT } },
    });
  }

  delete(id: string) {
    return this.prisma.recurring.delete({ where: { id } });
  }

  findDueToday(dayOfMonth: number) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return this.prisma.recurring.findMany({
      where: {
        active: true,
        dayOfMonth,
        OR: [{ lastExecutedAt: null }, { lastExecutedAt: { lt: todayStart } }],
      },
    });
  }

  markExecuted(id: string) {
    return this.prisma.recurring.update({
      where: { id },
      data: { lastExecutedAt: new Date() },
    });
  }
}
