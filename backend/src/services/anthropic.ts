import axios from 'axios';

interface AnthropicMessage {
    role: string;
    content: string;
}

interface AnthropicResponse {
    content: string[];
    stop_reason: string | null;
    model: string;
}

export class Anthropic {
    private apiKey: string;
    private baseUrl: string = 'https://api.anthropic.com/v1';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async complete(
        prompt: string,
        model: string = 'claude-2',
        maxTokens: number = 1000,
        temperature: number = 1
    ): Promise<string> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/messages`,
                {
                    model,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: maxTokens,
                    temperature,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.apiKey,
                        'anthropic-version': '2023-06-01',
                    },
                }
            );

            const data = response.data as AnthropicResponse;
            return data.content[0];
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Anthropic API error: ${error.response?.data || error.message}`);
            }
            throw error;
        }
    }

    async stream(
        prompt: string,
        model: string = 'claude-2',
        maxTokens: number = 1000,
        temperature: number = 1
    ): Promise<AsyncGenerator<string, void, unknown>> {
        const response = await axios.post(
            `${this.baseUrl}/messages`,
            {
                model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: maxTokens,
                temperature,
                stream: true,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                },
                responseType: 'stream',
            }
        );

        async function* streamGenerator() {
            for await (const chunk of response.data) {
                const lines = chunk.toString().split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6));
                        yield data.content[0];
                    }
                }
            }
        }

        return streamGenerator();
    }
}
