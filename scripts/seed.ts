import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { NestFactory } from '@nestjs/core';

import { AppModule } from '@/app.module';
import { IngestionService } from '@/ingestion/ingestion.service';

async function seed(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const ingestion = app.get(IngestionService);
    const base = join(process.cwd(), 'data', 'seed');

    await ingestion.importClubsCsv({
      buffer: readFileSync(join(base, 'clubs_uzb.csv')),
      sourceName: 'seed-csv',
      sourceUrl: 'local:data/seed/clubs_uzb.csv',
    });

    await ingestion.importPlayersCsv({
      buffer: readFileSync(join(base, 'players_uzb.csv')),
      sourceName: 'seed-csv',
      sourceUrl: 'local:data/seed/players_uzb.csv',
    });

    await ingestion.importTransfersCsv({
      buffer: readFileSync(join(base, 'transfers_uzb.csv')),
      sourceName: 'seed-csv',
      sourceUrl: 'local:data/seed/transfers_uzb.csv',
    });

    await ingestion.importNewsCsv({
      buffer: readFileSync(join(base, 'news_uzb.csv')),
      sourceName: 'seed-csv',
      sourceUrl: 'local:data/seed/news_uzb.csv',
    });
  } finally {
    await app.close();
  }
}

void seed();
