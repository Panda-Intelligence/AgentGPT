import { z } from 'zod';
import { Tool } from './tool';

export class ConcludeTool extends Tool {
  name = 'conclude';
  description = 'Conclude the task and provide a summary of findings';
  schema = z.object({
    task: z.string().describe('The task to conclude'),
    results: z.array(z.string()).describe('The results to summarize'),
  });

  protected async _call(args: z.infer<typeof this.schema>): Promise<string> {
    const { task, results } = args;

    return [
      '## Task Conclusion',
      `Task: ${task}`,
      '',
      '### Summary of Findings',
      ...results.map((result, index) => `${index + 1}. ${result}`),
      '',
      '### Final Thoughts',
      'The task has been completed. Please review the findings above.',
    ].join('\n');
  }
}
