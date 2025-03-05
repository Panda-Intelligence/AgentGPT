export type LLMModel = 'gpt-3.5-turbo' | 'gpt-3.5-turbo-16k' | 'gpt-4';

export interface ModelSettings {
  model: LLMModel;
  custom_api_key?: string;
  temperature: number;
  max_tokens: number;
  language: string;
}

export const LLM_MODEL_MAX_TOKENS: Record<LLMModel, number> = {
  'gpt-3.5-turbo': 4000,
  'gpt-3.5-turbo-16k': 16000,
  'gpt-4': 8000,
};
