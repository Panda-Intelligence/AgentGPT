import { z } from 'zod';

export const AnalysisSchema = z.object({
  reasoning: z.string(),
  action: z.string(),
  arg: z.string(),
});

export type Analysis = z.infer<typeof AnalysisSchema>;

export interface Task {
  id: string;
  type: string;
  status: string;
  value: string;
  info?: string;
  dependentTaskIds: string[];
}

export interface AgentTask extends Task {
  analysis?: Analysis;
  result?: string | null;
  children?: AgentTask[];
}

export interface AgentTaskOutput {
  tasks: AgentTask[];
}

export function createTaskOutput(
  tasks: AgentTask[] = [],
  lastTask: AgentTask | null = null
): AgentTaskOutput {
  if (lastTask) {
    const updatedTasks = tasks.map((task) =>
      task.id === lastTask.id ? { ...task, ...lastTask } : task
    );
    return { tasks: updatedTasks };
  }
  return { tasks };
}

export function shouldContinue(
  tasks: AgentTask[],
  completedTaskIds: Set<string> = new Set()
): boolean {
  const allTasksCompleted = tasks.every(
    (task) => completedTaskIds.has(task.id) || task.status === 'completed'
  );
  return !allTasksCompleted;
}

export function getNextTask(
  tasks: AgentTask[],
  completedTaskIds: Set<string> = new Set()
): AgentTask | null {
  return (
    tasks.find(
      (task) =>
        !completedTaskIds.has(task.id) &&
        task.status !== 'completed' &&
        task.dependentTaskIds.every((id) => completedTaskIds.has(id))
    ) || null
  );
}
