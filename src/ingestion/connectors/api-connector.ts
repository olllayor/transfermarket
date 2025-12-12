import type { ConnectorFetchResult, IngestionConnector } from './connector';

export class ApiConnector<T> implements IngestionConnector<T> {
  constructor(private readonly params: { sourceName: string; sourceUrl: string }) {}

  async fetch(): Promise<ConnectorFetchResult<T>> {
    throw new Error(`API connector not implemented: ${this.params.sourceUrl}`);
  }
}
