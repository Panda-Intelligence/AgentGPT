export interface SimilarTasks {
  task: string;
  score: number;
}

export abstract class AgentMemory {
  /**
   * Base class for AgentMemory
   * Expose __enter__ and __exit__ to ensure connections get closed within requests
   */

  abstract enter(): AgentMemory;
  abstract exit(): void;

  abstract addTasks(tasks: string[]): string[];
  abstract getSimilarTasks(query: string, scoreThreshold?: number): string[];
  abstract resetClass(): void;

  static shouldUse(): boolean {
    return true;
  }
}
