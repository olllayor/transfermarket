import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';

import { IngestionService } from './ingestion.service';

@ApiTags('admin.ingestion')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/ingestion')
export class IngestionController {
  constructor(private readonly ingestion: IngestionService) {}

  @Get('runs')
  @Roles('admin', 'editor')
  recentRuns() {
    return this.ingestion.recentRuns();
  }

  @Get('runs/:id')
  @Roles('admin', 'editor')
  @ApiParam({ name: 'id' })
  getRun(@Param('id') id: string) {
    return this.ingestion.getRun(id);
  }

  @Post('csv/players')
  @Roles('admin', 'editor')
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'sourceName', required: true })
  @ApiQuery({ name: 'sourceUrl', required: false })
  @UseInterceptors(FileInterceptor('file'))
  importPlayers(
    @UploadedFile() file: Express.Multer.File,
    @Query('sourceName') sourceName: string,
    @Query('sourceUrl') sourceUrl?: string,
  ) {
    return this.ingestion.importPlayersCsv({ buffer: file.buffer, sourceName, sourceUrl });
  }

  @Post('csv/clubs')
  @Roles('admin', 'editor')
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'sourceName', required: true })
  @ApiQuery({ name: 'sourceUrl', required: false })
  @UseInterceptors(FileInterceptor('file'))
  importClubs(
    @UploadedFile() file: Express.Multer.File,
    @Query('sourceName') sourceName: string,
    @Query('sourceUrl') sourceUrl?: string,
  ) {
    return this.ingestion.importClubsCsv({ buffer: file.buffer, sourceName, sourceUrl });
  }

  @Post('csv/transfers')
  @Roles('admin', 'editor')
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'sourceName', required: true })
  @ApiQuery({ name: 'sourceUrl', required: false })
  @UseInterceptors(FileInterceptor('file'))
  importTransfers(
    @UploadedFile() file: Express.Multer.File,
    @Query('sourceName') sourceName: string,
    @Query('sourceUrl') sourceUrl?: string,
  ) {
    return this.ingestion.importTransfersCsv({ buffer: file.buffer, sourceName, sourceUrl });
  }

  @Post('csv/news')
  @Roles('admin', 'editor')
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'sourceName', required: true })
  @ApiQuery({ name: 'sourceUrl', required: false })
  @UseInterceptors(FileInterceptor('file'))
  importNews(
    @UploadedFile() file: Express.Multer.File,
    @Query('sourceName') sourceName: string,
    @Query('sourceUrl') sourceUrl?: string,
  ) {
    return this.ingestion.importNewsCsv({ buffer: file.buffer, sourceName, sourceUrl });
  }
}
