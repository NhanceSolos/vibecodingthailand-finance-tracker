import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CategoryModule } from '../category/category.module';
import { TransactionModule } from '../transaction/transaction.module';
import { RecurringController } from './recurring.controller';
import { RecurringRepository } from './recurring.repository';
import { RecurringService } from './recurring.service';

@Module({
  imports: [AuthModule, CategoryModule, TransactionModule],
  controllers: [RecurringController],
  providers: [RecurringService, RecurringRepository],
})
export class RecurringModule {}
