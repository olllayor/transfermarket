import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';

import { CreateTransferDto, UpdateTransferDto } from './dto/transfer.dto';
import { TransfersService } from './transfers.service';

@ApiTags('admin.transfers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/transfers')
export class TransfersAdminController {
  constructor(private readonly transfers: TransfersService) {}

  @Post()
  @Roles('admin', 'editor')
  create(@Body() dto: CreateTransferDto) {
    return this.transfers.create(dto);
  }

  @Patch(':id')
  @Roles('admin', 'editor')
  @ApiParam({ name: 'id' })
  update(@Param('id') id: string, @Body() dto: UpdateTransferDto) {
    return this.transfers.update(id, dto);
  }

  @Post(':id/verify')
  @Roles('admin', 'editor')
  verify(@Param('id') id: string) {
    return this.transfers.verify(id);
  }
}
