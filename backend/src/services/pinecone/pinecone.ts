import { PineconeClient, Vector, QueryRequest, QueryResponse } from '@pinecone-database/pinecone';
import { Settings } from '../../settings';

interface EmbeddingMetadata {
  text: string;
  [key: string]: any;
}

interface QueryMetadata {
  text: string;
  score: number;
}

export class PineconeService {
  private static readonly DIMENSIONS = 1536;
  private client: PineconeClient;
  private indexName: string;
  private namespace: string;

  private constructor(
    client: PineconeClient,
    indexName: string,
    namespace: string = ''
  ) {
    this.client = client;
    this.indexName = indexName;
    this.namespace = namespace;
  }

  public static async initialize(settings: Settings): Promise<PineconeService> {
    const client = new PineconeClient();
    await client.init({
      apiKey: settings.pinecone_api_key,
      environment: settings.pinecone_environment,
    });

    return new PineconeService(
      client,
      settings.pinecone_index,
      settings.pinecone_namespace
    );
  }

  public async query(
    embeddings: number[],
    topK: number = 3,
    includeMetadata: boolean = true,
    includeValues: boolean = true,
    namespace?: string
  ): Promise<QueryMetadata[]> {
    const index = this.client.Index(this.indexName);

    const queryRequest: QueryRequest = {
      vector: embeddings,
      topK,
      includeMetadata,
      includeValues,
      namespace: namespace || this.namespace,
    };

    const queryResponse: QueryResponse = await index.query({ queryRequest });
    return queryResponse.matches.map((match) => ({
      text: (match.metadata as EmbeddingMetadata).text,
      score: match.score || 0,
    }));
  }

  public async upsert(
    vectors: Array<{
      id: string;
      values: number[];
      metadata: EmbeddingMetadata;
    }>,
    namespace?: string
  ): Promise<void> {
    const index = this.client.Index(this.indexName);
    const upsertVectors: Vector[] = vectors.map((vector) => ({
      id: vector.id,
      values: vector.values,
      metadata: vector.metadata,
    }));

    await index.upsert({
      upsertRequest: {
        vectors: upsertVectors,
        namespace: namespace || this.namespace,
      },
    });
  }

  public async delete(
    ids: string[],
    namespace?: string
  ): Promise<void> {
    const index = this.client.Index(this.indexName);
    await index.delete1({
      ids,
      namespace: namespace || this.namespace,
    });
  }

  public async deleteAll(namespace?: string): Promise<void> {
    const index = this.client.Index(this.indexName);
    await index.delete1({
      deleteAll: true,
      namespace: namespace || this.namespace,
    });
  }

  public async createIndex(
    dimension: number = PineconeService.DIMENSIONS,
    metric: string = 'cosine'
  ): Promise<void> {
    await this.client.createIndex({
      createRequest: {
        name: this.indexName,
        dimension,
        metric,
      },
    });
  }

  public async deleteIndex(): Promise<void> {
    await this.client.deleteIndex({
      indexName: this.indexName,
    });
  }

  public async listIndexes(): Promise<string[]> {
    const response = await this.client.listIndexes();
    return response.indexes.map((index) => index.name);
  }
}
