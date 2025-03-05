import { Context } from 'hono';
import { z } from 'zod';
import { Settings } from '@/settings';
import { UserBase } from '@/schemas';
import { PlatformaticError } from '../errors';

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
  constructor(private settings: Settings) { }

  validateAndParseKey(apiKey?: string): string {
    const envKey = this.settings.openai_api_key;
    if (!envKey) {
      throw new PlatformaticError({
        code: 'MISSING_API_KEY',
        message: 'OpenAI API key not found',
        statusCode: 400,
      });
    }

    return envKey;
  }

  getModel(settings: ModelSettings): string {
    if (!settings.model) {
      return 'gpt-3.5-turbo';
    }

    const allowedModels = new Set([
      'gpt-4',
      'gpt-4-32k',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
    ]);

    if (!allowedModels.has(settings.model)) {
      throw new PlatformaticError({
        code: 'INVALID_MODEL',
        message: 'Invalid model specified',
        statusCode: 400,
      });
    }

    return settings.model;
  }

  validateEnvironment(): void {
    if (!this.settings.openai_api_key) {
      throw new PlatformaticError({
        code: 'MISSING_API_KEY',
        message: 'OpenAI API key not found in environment',
        statusCode: 500,
      });
    }
  }
}

export const getAgentService = (c: Context): AgentService => {
  return new DefaultAgentService(c.get('settings'));
};

export const getCurrentUser = async (c: Context): Promise<UserBase> => {
  const user = c.get('user');
  if (!user) {
    throw new PlatformaticError({
      code: 'UNAUTHORIZED',
      message: 'User not authenticated',
      statusCode: 401,
    });
  }
  return user;
};
