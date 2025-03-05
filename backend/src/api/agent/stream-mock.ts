export class MockStreamingResponse {
  private chunks: string[];
  private index: number;
  private interval: number;

  constructor(text: string, interval: number = 100) {
    this.chunks = text.split(' ');
    this.index = 0;
    this.interval = interval;
  }

  async *iterate(): AsyncGenerator<string, void, unknown> {
    for (const chunk of this.chunks) {
      yield chunk + ' ';
      await new Promise(resolve => setTimeout(resolve, this.interval));
    }
  }

  static async *streamTokens(
    tokens: string[],
    interval: number = 100
  ): AsyncGenerator<string, void, unknown> {
    for (const token of tokens) {
      yield token;
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
}
