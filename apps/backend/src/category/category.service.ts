import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CategoryResponse,
  CreateCategoryDto,
  TransactionType,
  UpdateCategoryDto,
} from 'shared';
import { CategoryRepository } from './category.repository';

function isPrismaUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  );
}

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async findAll(userId: string, type?: TransactionType): Promise<CategoryResponse[]> {
    const categories = await this.categoryRepository.findAll(userId, type);
    return categories.map(this.toResponse);
  }

  async create(dto: CreateCategoryDto, userId: string): Promise<CategoryResponse> {
    try {
      const category = await this.categoryRepository.create({ ...dto, userId });
      return this.toResponse(category);
    } catch (error) {
      if (isPrismaUniqueViolation(error)) {
        throw new ConflictException('Category with this name and type already exists');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateCategoryDto, userId: string): Promise<CategoryResponse> {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new NotFoundException('Category not found');
    if (category.userId === null) throw new ForbiddenException('Cannot modify default categories');
    if (category.userId !== userId) throw new ForbiddenException('Cannot modify another user\'s category');

    try {
      const updated = await this.categoryRepository.update(id, dto);
      return this.toResponse(updated);
    } catch (error) {
      if (isPrismaUniqueViolation(error)) {
        throw new ConflictException('Category with this name already exists');
      }
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new NotFoundException('Category not found');
    if (category.userId === null) throw new ForbiddenException('Cannot delete default categories');
    if (category.userId !== userId) throw new ForbiddenException('Cannot delete another user\'s category');

    const txCount = await this.categoryRepository.countTransactions(id);
    if (txCount > 0) throw new ConflictException('Cannot delete category with existing transactions');

    await this.categoryRepository.delete(id);
  }

  private toResponse(category: {
    id: string;
    name: string;
    icon: string;
    type: string;
    userId: string | null;
    createdAt: Date;
  }): CategoryResponse {
    return {
      id: category.id,
      name: category.name,
      icon: category.icon,
      type: category.type as TransactionType,
      userId: category.userId,
      createdAt: category.createdAt,
    };
  }
}
