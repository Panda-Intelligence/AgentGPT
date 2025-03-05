import { z } from 'zod';
import { Tool } from './tool';
import { OpenAI } from 'openai';

export class ReasonTool extends Tool {
  name = 'reason';
  description = 'Reason about the task and explain the thought process';
  schema = z.object({
    task: z.string().describe('The task to reason about'),
    context: z.string().optional().describe('Additional context for reasoning'),
  });

  private openai: OpenAI;

  constructor() {
    super();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  protected async _call(args: z.infer<typeof this.schema>): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a reasoning assistant that helps break down and analyze tasks.',
          },
          {
            role: 'user',
            content: this.createPrompt(args.task, args.context),
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return response.choices[0]?.message?.content || 'No reasoning generated';
    } catch (error) {
      console.error('Reasoning error:', error);
      return 'Error generating reasoning';
    }
  }

  private createPrompt(task: string, context?: string): string {
    let prompt = `Please help me reason about the following task:\n\n${task}`;

    if (context) {
      prompt += `\n\nAdditional context:\n${context}`;
    }

    prompt += '\n\nPlease provide:\n1. Analysis of the task\n2. Key considerations\n3. Potential approaches\n4. Recommended next steps';

    return prompt;
  }
}
