import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CreateTransactionDto,
  GetSummaryQueryDto,
  GetTransactionsQueryDto,
  UpdateTransactionDto,
} from 'shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransactionService } from './transaction.service';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateTransactionDto) {
    return this.transactionService.create(dto, user.userId);
  }

  @Get('summary')
  getSummary(@CurrentUser() user: JwtUser, @Query() query: GetSummaryQueryDto) {
    return this.transactionService.getSummary(user.userId, query.month, query.year);
  }

  @Get()
  findAll(@CurrentUser() user: JwtUser, @Query() query: GetTransactionsQueryDto) {
    return this.transactionService.findAll(user.userId, query);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionService.update(id, dto, user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.transactionService.remove(id, user.userId);
  }
}
