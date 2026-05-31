import { TransactionType } from '../enums/transaction-type.enum';

export interface RecurringCategoryInfo {
  id: string;
  name: string;
  icon: string;
}

export interface RecurringResponse {
  id: string;
  amount: number;
  type: TransactionType;
  description: string;
  dayOfMonth: number;
  active: boolean;
  categoryId: string;
  category: RecurringCategoryInfo;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
