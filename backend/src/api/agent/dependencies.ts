import { Context } from 'hono';
import { z } from 'zod';
import { UserBase } from '@/schemas';
import { PlatformaticError } from '../errors';
import { Bindings } from '@/types';

export const ModelSettings = z.object({
  language: z.string(),
  model: z.string(),
  temperature: z.number().min(0).max(1),
  maxTokens: z.number().min(0),
  customApiKey: z.string().optional(),
});

export type ModelSettings = z.infer<typeof ModelSettings>;

export const AgentRunRequest = z.object({
  goal: z.string(),
  modelSettings: ModelSettings,
  tasks: z.array(z.object({
    id: z.string(),
    type: z.string(),
    status: z.string(),
    value: z.string(),
    info: z.string().optional(),
    dependentTaskIds: z.array(z.string()),
  })),
});

export type AgentRunRequest = z.infer<typeof AgentRunRequest>;

export interface AgentService {
  validateAndParseKey(apiKey?: string): string;
  getModel(settings: ModelSettings): string;
  validateEnvironment(): void;
}

export class DefaultAgentService implements AgentService {
  constructor(private settings: Bindings) { }

  validateAndParseKey(apiKey?: string): string {
    const envKey = this.settings.OPENAI_API_KEY;
    if (!envKey) {
      throw new PlatformaticError({
        key: 'MISSING_API_KEY',
        detail: 'OpenAI API key not found',
        code: 400,
      });
    }

    return envKey;
  }

  getModel(settings: ModelSettings): string {
    if (!settings.model) {
      return 'gpt-4o';
    }

    const allowedModels = new Set([
      'gpt-4o',
      'gpt-4o-32k'
    ]);

    if (!allowedModels.has(settings.model)) {
      throw new PlatformaticError({
        key: 'INVALID_MODEL',
        detail: 'Invalid model specified',
        code: 400,
      });
    }

    return settings.model;
  }

  validateEnvironment(): void {
    if (!this.settings.openai_api_key) {
      throw new PlatformaticError({
        key: 'MISSING_API_KEY',
        detail: 'OpenAI API key not found in environment',
        code: 500,
      });
    }
  }
}

export const getAgentService = (c: Context): AgentService => {
  return new DefaultAgentService(c.env);
};

export const getCurrentUser = async (c: Context): Promise<UserBase> => {
  const user = c.get('user');
  if (!user) {
    throw new PlatformaticError({
      key: 'UNAUTHORIZED',
      detail: 'User not authenticated',
      code: 401,
    });
  }
  return user;
};
