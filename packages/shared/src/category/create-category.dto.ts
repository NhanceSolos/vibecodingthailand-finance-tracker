import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TransactionType } from '../enums/transaction-type.enum';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  icon: string;

  @IsEnum(TransactionType)
  type: TransactionType;
}
