import { Analysis } from '../analysis'

export interface AgentService {
  startGoalAgent(goal: string): Promise<string[]>;
  analyzeTaskAgent(goal: string, task: string, toolNames: string[]): Promise<Analysis>;
  executeTaskAgent(goal: string, task: string, analysis: Analysis): Promise<Response>;
  createTasksAgent(goal: string, tasks: string[], lastTask: string, result: string, completedTasks?: string[]): Promise<string[]>;
  summarizeTaskAgent(goal: string, results: string[]): Promise<Response>;
  chat(message: string, results: string[]): Promise<Response>;
}
