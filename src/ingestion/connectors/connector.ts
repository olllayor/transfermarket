export type ConnectorSource = {
  name: string;
  url?: string;
};

export type ConnectorFetchResult<T> = {
  source: ConnectorSource;
  fetchedAt: Date;
  data: T;
};

export interface IngestionConnector<T> {
  fetch(): Promise<ConnectorFetchResult<T>>;
}
