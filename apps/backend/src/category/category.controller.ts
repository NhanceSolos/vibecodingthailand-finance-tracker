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
import { CreateCategoryDto, GetCategoriesQueryDto, UpdateCategoryDto } from 'shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CategoryService } from './category.service';

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser, @Query() query: GetCategoriesQueryDto) {
    return this.categoryService.findAll(user.userId, query.type);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto, user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, dto, user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.categoryService.remove(id, user.userId);
  }
}
