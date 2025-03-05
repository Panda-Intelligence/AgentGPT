import { AgentMemory } from './memory';

export class NullAgentMemory implements AgentMemory {
  enter(): AgentMemory {
    return this;
  }

  exit(): void {
    // No operation
  }

  addTasks(tasks: string[]): string[] {
    return [];
  }

  getSimilarTasks(query: string, scoreThreshold: number = 0): string[] {
    return [];
  }

  resetClass(): void {
    // No operation
  }
}
