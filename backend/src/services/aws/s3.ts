import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  CreateMultipartUploadCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';

const REGION = 'us-east-1';

export interface PresignedPost {
  url: string;
  fields: Record<string, string>;
}

export class SimpleStorageService {
  private client: S3Client;
  private bucket: string;

  constructor(bucket: string | undefined) {
    if (!bucket) {
      throw new Error('Bucket name must be provided');
    }

    this.client = new S3Client({ region: REGION });
    this.bucket = bucket;
  }

  async createPresignedUploadUrl(objectName: string): Promise<PresignedPost> {
    const { url, fields } = await createPresignedPost(this.client, {
      Bucket: this.bucket,
      Key: objectName,
      Expires: 3600, // URL expires in 1 hour
    });

    return {
      url,
      fields,
    };
  }

  async createPresignedDownloadUrl(objectName: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: objectName,
    });

    return await getSignedUrl(this.client, command, { expiresIn: 3600 });
  }

  async uploadToBucket(
    objectName: string,
    file: Buffer | Readable
  ): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectName,
        Body: file,
      });

      await this.client.send(command);
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw error;
    }
  }

  async downloadFile(objectName: string, localFilename: string): Promise<void> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: objectName,
      });

      const response = await this.client.send(command);

      if (response.Body instanceof Readable) {
        const writeStream = fs.createWriteStream(localFilename);
        await new Promise((resolve, reject) => {
          response.Body
            .pipe(writeStream)
            .on('finish', resolve)
            .on('error', reject);
        });
      }
    } catch (error) {
      console.error('Error downloading from S3:', error);
      throw error;
    }
  }

  async listKeys(prefix: string): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
      });

      const response = await this.client.send(command);

      if (!response.Contents) {
        return [];
      }

      return response.Contents
        .map(file => file.Key)
        .filter((key): key is string => key !== undefined);
    } catch (error) {
      console.error('Error listing S3 objects:', error);
      throw error;
    }
  }

  async downloadFolder(prefix: string, localPath: string): Promise<string[]> {
    const localFiles: string[] = [];
    const keys = await this.listKeys(prefix);

    for (const key of keys) {
      const localFilename = path.join(localPath, key.split('/').pop() || '');
      await this.downloadFile(key, localFilename);
      localFiles.push(localFilename);
    }

    return localFiles;
  }

  async deleteFolder(prefix: string): Promise<void> {
    const keys = await this.listKeys(prefix);

    if (keys.length === 0) {
      return;
    }

    const command = new DeleteObjectsCommand({
      Bucket: this.bucket,
      Delete: {
        Objects: keys.map(key => ({ Key: key })),
      },
    });

    try {
      await this.client.send(command);
    } catch (error) {
      console.error('Error deleting S3 objects:', error);
      throw error;
    }
  }
}
