import { PineconeService } from './pinecone';
import { Settings } from '../../settings';

export class PineconeLifetime {
  private static instance: PineconeService | null = null;

  public static async initialize(settings: Settings): Promise<void> {
    if (!PineconeLifetime.instance) {
      PineconeLifetime.instance = await PineconeService.initialize(settings);
    }
  }

  public static getInstance(): PineconeService {
    if (!PineconeLifetime.instance) {
      throw new Error('PineconeService not initialized');
    }
    return PineconeLifetime.instance;
  }
}
