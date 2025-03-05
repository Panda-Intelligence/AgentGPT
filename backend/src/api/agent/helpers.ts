import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { AgentTask } from './analysis';

export const TaskRequestBody = z.object({
  goal: z.string(),
  task: z.string(),
  modelSettings: z.object({
    language: z.string(),
    model: z.string(),
    temperature: z.number(),
    maxTokens: z.number(),
    customApiKey: z.string().optional(),
  }),
  lastTask: z.string().optional(),
  tasks: z.array(z.any()),
  taskId: z.string().optional(),
  dependentTaskIds: z.array(z.string()).optional(),
});

export type TaskRequestBody = z.infer<typeof TaskRequestBody>;

export interface Message {
  role: string;
  content: string;
}

export function createTaskMessage(
  goal: string,
  task: string,
  modelName: string
): Message[] {
  return [
    {
      role: 'system',
      content: `You are an AI task creation agent. Your goal is to create tasks for: ${goal}`,
    },
    {
      role: 'user',
      content: `Create new task for ${task}. Your response should be in JSON format.`,
    },
  ];
}

export function createTask(
  value: string,
  description: string = '',
  dependentTaskIds: string[] = [],
  type: string = 'task',
  status: string = 'incomplete'
): AgentTask {
  return {
    id: uuidv4(),
    type,
    status,
    value,
    info: description,
    dependentTaskIds,
  };
}

export function extractTasks(
  input: string,
  completedTaskIds: Set<string> = new Set()
): AgentTask[] {
  try {
    const parsed = JSON.parse(input);
    if (!Array.isArray(parsed)) {
      return [createTask(input)];
    }

    return parsed.map((task) => {
      if (typeof task === 'string') {
        return createTask(task);
      }

      return {
        ...createTask(
          task.value || task.task || task.description || '',
          task.info || task.additional_info || '',
          task.dependentTaskIds || task.prerequisites || []
        ),
        status: completedTaskIds.has(task.id) ? 'completed' : 'incomplete',
      };
    });
  } catch (error) {
    console.error('Error parsing tasks:', error);
    return [createTask(input)];
  }
}

export function isTaskComplete(task: AgentTask): boolean {
  return task.status === 'completed';
}

export function areTasksDependenciesMet(
  task: AgentTask,
  completedTaskIds: Set<string>
): boolean {
  return task.dependentTaskIds.every((id) => completedTaskIds.has(id));
}

export function getCompletedTaskIds(tasks: AgentTask[]): Set<string> {
  return new Set(tasks.filter(isTaskComplete).map((task) => task.id));
}
