import { z } from 'zod';

// Base schemas
export const AgentRunSchema = z.object({
  goal: z.string(),
  run_id: z.string(),
});

export const AgentTaskAnalyzeSchema = z.object({
  goal: z.string(),
  task: z.string().optional(),
  tool_names: z.array(z.string()).optional(),
});

export const AgentTaskExecuteSchema = z.object({
  goal: z.string().optional(),
  task: z.string().optional(),
  analysis: z.object({
    reasoning: z.string(),
    action: z.string(),
    arg: z.string(),
  }),
});

export const AgentTaskCreateSchema = z.object({
  goal: z.string(),
  tasks: z.array(z.any()).optional(),
  last_task: z.string().optional(),
  result: z.string().optional(),
  completed_tasks: z.array(z.any()).optional(),
  run_id: z.string(),
});

export const AgentSummarizeSchema = z.object({
  goal: z.string().optional(),
  results: z.array(z.string()),
});

export const AgentChatSchema = z.object({
  message: z.string(),
  results: z.array(z.string()),
});

// Type exports
export type AgentRun = z.infer<typeof AgentRunSchema>;
export type AgentTaskAnalyze = z.infer<typeof AgentTaskAnalyzeSchema>;
export type AgentTaskExecute = z.infer<typeof AgentTaskExecuteSchema>;
export type AgentTaskCreate = z.infer<typeof AgentTaskCreateSchema>;
export type AgentSummarize = z.infer<typeof AgentSummarizeSchema>;
export type AgentChat = z.infer<typeof AgentChatSchema>;


// Schema definitions
export const NewTasksResponse = z.object({
  newTasks: z.array(z.any()),
  run_id: z.string(),
});

export const ToolModel = z.object({
  name: z.string(),
  description: z.string(),
  color: z.string(),
  image_url: z.string().optional(),
});

export const ToolsResponse = z.object({
  tools: z.array(ToolModel),
});

export type NewTasksResponse = z.infer<typeof NewTasksResponse>;
export type ToolModel = z.infer<typeof ToolModel>;
export type ToolsResponse = z.infer<typeof ToolsResponse>;
