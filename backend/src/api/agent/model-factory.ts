import { OpenAI } from 'openai';
import { ModelSettings } from './dependencies';
import { Message } from './helpers';
import { PlatformaticError } from '../errors';

export interface LanguageModel {
  name: string;
  maxTokens: number;
  tokenLimit: number;
  completionModel?: string;
  embeddingModel?: string;
  contextWindow: number;
  execute(messages: Message[]): AsyncGenerator<string, void, unknown>;
}

export class OpenAILanguageModel implements LanguageModel {
  private api: OpenAI;
  public name: string;
  public maxTokens: number;
  public tokenLimit: number;
  public completionModel?: string;
  public embeddingModel?: string;
  public contextWindow: number;

  constructor(
    apiKey: string,
    model: string = 'gpt-4o',
    maxTokens: number = 8192
  ) {
    const configuration = { apiKey };
    this.api = new OpenAI(configuration);
    this.name = model;
    this.maxTokens = maxTokens;
    this.tokenLimit = this.getTokenLimit(model);
    this.contextWindow = this.getContextWindow(model);
    this.completionModel = model;
    this.embeddingModel = 'text-embedding-ada-002';
  }

  private getTokenLimit(model: string): number {
    const limits: Record<string, number> = {
      'gpt-4o': 8192,
      'gpt-4o-32k': 32768
    };
    return limits[model] || 4096;
  }

  private getContextWindow(model: string): number {
    return Math.floor(this.getTokenLimit(model) * 0.8);
  }

  async *execute(messages: Message[]): AsyncGenerator<string, void, unknown> {
    try {
      const response = await this.api.chat.completions.create({
        model: this.name,
        messages,
        temperature: 0.9,
        max_tokens: this.maxTokens,
        stream: true,
      });

      for await (const chunk of response as any) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error: any) {
      throw new PlatformaticError({
        key: 'OPENAI_ERROR',
        detail: error.response?.data?.error?.message || 'OpenAI API error',
        code: error.response?.status || 500,
      });
    }
  }
}

export function createModel(settings: ModelSettings, apiKey: string): LanguageModel {
  return new OpenAILanguageModel(
    apiKey,
    settings.model,
    settings.maxTokens
  );
}
