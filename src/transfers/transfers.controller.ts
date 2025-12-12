import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';

import { TransfersQueryDto } from './dto/transfer.dto';
import { TransfersService } from './transfers.service';

@ApiTags('transfers')
@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfers: TransfersService) {}

  @Get()
  list(@Query() query: TransfersQueryDto) {
    return this.transfers.list(query);
  }

  @Get(':id')
  @ApiParam({ name: 'id' })
  get(@Param('id') id: string) {
    return this.transfers.findById(id);
  }
}
