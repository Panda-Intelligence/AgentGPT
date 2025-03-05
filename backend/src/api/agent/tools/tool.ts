import { z } from 'zod';

export abstract class Tool {
  abstract name: string;
  abstract description: string;
  abstract schema: z.ZodObject<any> | z.ZodString;

  constructor() { }

  public available() {
    return true
  }

  async call(arg: string): Promise<string> {
    try {
      const parsed = await this.validateArg(arg);
      return await this._call(parsed);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return `Invalid argument: ${error.message}`;
      }
      throw error;
    }
  }

  protected abstract _call(arg: any): Promise<string>;

  protected async validateArg(arg: string): Promise<any> {
    try {
      const parsed = JSON.parse(arg);
      return this.schema.parse(parsed);
    } catch (error) {
      // If JSON parsing fails, try to parse the raw string
      return this.schema.parse(arg);
    }
  }

  public toJSON(): object {
    return {
      name: this.name,
      description: this.description,
      schema: this.schema,
    };
  }
}
