import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';
import { TransactionType } from '../enums/transaction-type.enum';

export class CreateRecurringDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth: number;
}
