import { z } from 'zod';
import { Tool } from './tool';
import { OpenAI } from 'openai';

export class OpenAIFunctionTool extends Tool {
  name = 'openai-function';
  description = 'Execute OpenAI function calls';
  schema = z.object({
    name: z.string().describe('The name of the function to call'),
    args: z.record(z.any()).describe('The arguments for the function'),
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
        model: 'gpt-3.5-turbo-0613',
        messages: [
          {
            role: 'user',
            content: `Execute function: ${args.name} with arguments: ${JSON.stringify(args.args)}`,
          },
        ],
        functions: [
          {
            name: args.name,
            parameters: {
              type: 'object',
              properties: this.convertArgsToJsonSchema(args.args),
            },
          },
        ],
        function_call: { name: args.name },
      });

      const functionCall = response.choices[0]?.message?.function_call;
      if (!functionCall) {
        return 'No function call generated';
      }

      return JSON.stringify({
        name: functionCall.name,
        arguments: JSON.parse(functionCall.arguments || '{}'),
      }, null, 2);
    } catch (error) {
      console.error('OpenAI function call error:', error);
      return 'Error executing OpenAI function';
    }
  }

  private convertArgsToJsonSchema(args: Record<string, any>): Record<string, any> {
    const schema: Record<string, any> = {};

    for (const [key, value] of Object.entries(args)) {
      schema[key] = {
        type: typeof value,
        description: `Parameter: ${key}`,
      };

      if (Array.isArray(value)) {
        schema[key].type = 'array';
        schema[key].items = {
          type: typeof value[0],
        };
      }
    }

    return schema;
  }
}
