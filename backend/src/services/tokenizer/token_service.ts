import GPT3Tokenizer from 'gpt3-tokenizer';

export class TokenService {
  private tokenizer: any;  // Type 'any' used because GPT3Tokenizer doesn't have TypeScript types

  constructor() {
    this.tokenizer = new GPT3Tokenizer({ type: 'gpt3' });
  }

  public count_tokens(text: string): number {
    try {
      const encoded = this.tokenizer.encode(text);
      return encoded.bpe.length;
    } catch (error) {
      console.error('Error counting tokens:', error);
      // Fallback to a simple approximation if tokenizer fails
      return Math.ceil(text.length / 4);
    }
  }

  public count_message_tokens(messages: Array<{ role: string; content: string }>): number {
    // Calculate tokens based on GPT-3.5/4 message format
    let total_tokens = 0;

    for (const message of messages) {
      // Add tokens for message format (3 for role formatting)
      total_tokens += 3;

      // Add tokens for content
      total_tokens += this.count_tokens(message.content);

      // Add tokens for role
      total_tokens += this.count_tokens(message.role);
    }

    // Add tokens for message formatting (3 for formatting)
    total_tokens += 3;

    return total_tokens;
  }
}
