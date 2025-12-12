import type { ConnectorFetchResult, IngestionConnector } from './connector';

export class ScraperConnector<T> implements IngestionConnector<T> {
  constructor(private readonly params: { sourceName: string; sourceUrl: string }) {}

  async fetch(): Promise<ConnectorFetchResult<T>> {
    throw new Error(
      `Scraping connector not implemented. Ensure legal / robots.txt compliance before scraping: ${this.params.sourceUrl}`,
    );
  }
}
