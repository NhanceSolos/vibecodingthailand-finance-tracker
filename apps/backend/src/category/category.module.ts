import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CategoryController } from './category.controller';
import { CategoryRepository } from './category.repository';
import { CategoryService } from './category.service';

@Module({
  imports: [AuthModule],
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepository],
  exports: [CategoryRepository],
})
export class CategoryModule {}
