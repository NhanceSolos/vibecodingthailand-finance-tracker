import { IsEnum, IsOptional } from 'class-validator';
import { TransactionType } from '../enums/transaction-type.enum';

export class GetCategoriesQueryDto {
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;
}
