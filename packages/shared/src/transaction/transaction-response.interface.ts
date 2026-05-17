import { TransactionSource } from '../enums/transaction-source.enum';
import { TransactionType } from '../enums/transaction-type.enum';

export interface TransactionCategoryInfo {
  id: string;
  name: string;
  icon: string;
}

export interface TransactionResponse {
  id: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  source: TransactionSource;
  categoryId: string;
  category: TransactionCategoryInfo;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedTransactionsResponse {
  data: TransactionResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  name: string;
  icon: string;
  total: number;
  percentage: number;
}

export interface DailyTotal {
  date: string;
  income: number;
  expense: number;
}

export interface TransactionSummaryResponse {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategoryExpense: CategoryBreakdown[];
  byCategoryIncome: CategoryBreakdown[];
  dailyTotals: DailyTotal[];
}
