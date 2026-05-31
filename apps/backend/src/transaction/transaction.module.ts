import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CategoryModule } from '../category/category.module';
import { TransactionController } from './transaction.controller';
import { TransactionRepository } from './transaction.repository';
import { TransactionService } from './transaction.service';

@Module({
  imports: [AuthModule, CategoryModule],
  controllers: [TransactionController],
  providers: [TransactionService, TransactionRepository],
  exports: [TransactionRepository],
})
export class TransactionModule {}
