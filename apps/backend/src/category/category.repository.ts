import { Injectable } from '@nestjs/common';
import { TransactionType } from 'shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string, type?: TransactionType) {
    return this.prisma.category.findMany({
      where: {
        OR: [{ userId: null }, { userId }],
        ...(type && { type }),
      },
      orderBy: [{ userId: 'asc' }, { name: 'asc' }],
    });
  }

  findById(id: string) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  create(data: { name: string; icon: string; type: TransactionType; userId: string }) {
    return this.prisma.category.create({ data });
  }

  update(id: string, data: { name?: string; icon?: string }) {
    return this.prisma.category.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }

  countTransactions(categoryId: string) {
    return this.prisma.transaction.count({ where: { categoryId } });
  }
}
