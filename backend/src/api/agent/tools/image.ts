import { z } from 'zod';
import { Tool } from './tool';
import { OpenAI } from 'openai';
import axios from 'axios';
import { createHash } from 'crypto';
import { SimpleStorageService } from '@/services/aws/s3';

export class ImageTool extends Tool {
  name = 'image';
  description = 'Create and edit images';
  schema = z.object({
    prompt: z.string().describe('The image generation prompt'),
    size: z.enum(['256x256', '512x512', '1024x1024']).optional(),
    style: z.string().optional(),
  });

  private openai: OpenAI;
  private s3: SimpleStorageService;

  constructor() {
    super();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.s3 = new SimpleStorageService(process.env.AWS_BUCKET_NAME);
  }

  protected async _call(args: z.infer<typeof this.schema>): Promise<string> {
    try {
      const imageUrl = await this.generateImage(args.prompt, args.size);
      if (!imageUrl) {
        return 'Failed to generate image';
      }

      const imageData = await this.downloadImage(imageUrl);
      const filename = this.generateFilename(args.prompt);
      const s3Key = `images/${filename}`;

      await this.s3.uploadToBucket(s3Key, imageData);
      const publicUrl = await this.s3.createPresignedDownloadUrl(s3Key);

      return [
        'Image generated successfully!',
        `Prompt: ${args.prompt}`,
        `Style: ${args.style || 'default'}`,
        `Size: ${args.size || '1024x1024'}`,
        `View image: ${publicUrl}`,
      ].join('\n');
    } catch (error) {
      console.error('Image generation error:', error);
      return 'Error generating image';
    }
  }

  private async generateImage(
    prompt: string,
    size: string = '1024x1024'
  ): Promise<string | null> {
    try {
      const response = await this.openai.images.generate({
        prompt,
        n: 1,
        size: size as '256x256' | '512x512' | '1024x1024',
      });

      return response.data[0]?.url || null;
    } catch (error) {
      console.error('OpenAI image generation error:', error);
      return null;
    }
  }

  private async downloadImage(url: string): Promise<Buffer> {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });
    return Buffer.from(response.data);
  }

  private generateFilename(prompt: string): string {
    const hash = createHash('md5')
      .update(prompt + Date.now().toString())
      .digest('hex');
    return `${hash}.png`;
  }
}
