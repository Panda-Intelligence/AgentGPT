import { z } from 'zod';
import { Analysis, AnalysisSchema } from './analysis';

export class TaskOutputParser {
  private static readonly START_DELIMITERS = ['{', '['];
  private static readonly END_DELIMITERS = ['}', ']'];

  static async *parsePartialJson(
    text: string
  ): AsyncGenerator<Partial<Analysis>, void, unknown> {
    let jsonBuffer = '';
    let inJson = false;
    let bracketCount = 0;
    let startDelimiter = '';
    let endDelimiter = '';

    for (const char of text) {
      if (!inJson && TaskOutputParser.START_DELIMITERS.includes(char)) {
        inJson = true;
        startDelimiter = char;
        endDelimiter = TaskOutputParser.END_DELIMITERS[
          TaskOutputParser.START_DELIMITERS.indexOf(char)
        ];
        bracketCount = 1;
      }

      if (inJson) {
        jsonBuffer += char;

        if (char === startDelimiter) {
          bracketCount++;
        } else if (char === endDelimiter) {
          bracketCount--;
        }

        if (bracketCount === 1) {
          try {
            const parsed = JSON.parse(jsonBuffer);
            const result = TaskOutputParser.validateAndCleanAnalysis(parsed);
            if (result) {
              yield result;
            }
          } catch (e) {
            // Continue collecting JSON if parsing fails
          }
        }
      }
    }

    // Try to parse any remaining JSON
    if (jsonBuffer) {
      try {
        const parsed = JSON.parse(jsonBuffer);
        const result = TaskOutputParser.validateAndCleanAnalysis(parsed);
        if (result) {
          yield result;
        }
      } catch (e) {
        // Ignore parsing errors for incomplete JSON
      }
    }
  }

  private static validateAndCleanAnalysis(
    obj: any
  ): Partial<Analysis> | null {
    try {
      if (Array.isArray(obj)) {
        // Handle array responses
        for (const item of obj) {
          const result = TaskOutputParser.validateAndCleanAnalysis(item);
          if (result) {
            return result;
          }
        }
        return null;
      }

      // Try to validate against the schema
      const result = AnalysisSchema.partial().safeParse(obj);
      if (result.success) {
        return result.data;
      }

      // If validation fails, try to extract known fields
      const analysis: Partial<Analysis> = {};
      if (typeof obj.reasoning === 'string') analysis.reasoning = obj.reasoning;
      if (typeof obj.action === 'string') analysis.action = obj.action;
      if (typeof obj.arg === 'string') analysis.arg = obj.arg;

      // Return null if no valid fields were found
      return Object.keys(analysis).length > 0 ? analysis : null;
    } catch (e) {
      return null;
    }
  }
}
