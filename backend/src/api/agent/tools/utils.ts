import { OpenAI } from 'openai';
import { z } from 'zod';

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

const SUMMARY_PROMPT = {
  'en-US': 'Summarize the following search results for the query: "{query}"\n\nSearch results:\n{results}',
  'zh-CN': '为以下搜索查询总结结果："{query}"\n\n搜索结果：\n{results}',
  // Add more languages as needed
};

export async function summarizeSearchResults(
  results: SearchResult[],
  query: string,
  language: string = 'en-US'
): Promise<string> {
  const formattedResults = results
    .map((result, i) => (
      `${i + 1}. ${result.title}\n${result.snippet}\nSource: ${result.link}\n`
    ))
    .join('\n');

  // @ts-ignore
  const prompt = (SUMMARY_PROMPT[language] || SUMMARY_PROMPT['en-US'])
    .replace('{query}', query)
    .replace('{results}', formattedResults);

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes search results.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || 'Error summarizing results';
  } catch (error) {
    console.error('Error summarizing results:', error);
    return formattedResults;
  }
}

export function validateEnvironmentVariables(requiredVars: string[]): void {
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

export function safeJsonParse<T>(
  schema: z.ZodType<T>,
  data: string,
  defaultValue: T
): T {
  try {
    const parsed = JSON.parse(data);
    return schema.parse(parsed);
  } catch (error) {
    console.error('JSON parse error:', error);
    return defaultValue;
  }
}

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength - 3) + '...';
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim();
}

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
