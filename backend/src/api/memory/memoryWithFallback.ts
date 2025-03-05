import { AgentMemory } from './memory';

export class MemoryWithFallback implements AgentMemory {
  private primary: AgentMemory;
  private secondary: AgentMemory;

  constructor(primary: AgentMemory, secondary: AgentMemory) {
    this.primary = primary;
    this.secondary = secondary;
  }

  enter(): AgentMemory {
    try {
      return this.primary.enter();
    } catch (e) {
      console.error(e);
      return this.secondary.enter();
    }
  }

  exit(): void {
    try {
      this.primary.exit();
    } catch (e) {
      console.error(e);
      this.secondary.exit();
    }
  }

  addTasks(tasks: string[]): string[] {
    try {
      return this.primary.addTasks(tasks);
    } catch (e) {
      console.error(e);
      return this.secondary.addTasks(tasks);
    }
  }

  getSimilarTasks(query: string, scoreThreshold: number = 0): string[] {
    try {
      return this.primary.getSimilarTasks(query, scoreThreshold);
    } catch (e) {
      console.error(e);
      return this.secondary.getSimilarTasks(query, scoreThreshold);
    }
  }

  resetClass(): void {
    try {
      this.primary.resetClass();
    } catch (e) {
      console.error(e);
      this.secondary.resetClass();
    }
  }
}
