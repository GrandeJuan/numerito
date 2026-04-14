import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { AvatarStoragePort } from '../../domain/ports/avatar-storage.port';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class S3AvatarStorageAdapter implements AvatarStoragePort {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.getOrThrow<string>('AWS_S3_BUCKET');
    this.s3 = new S3Client({
      region: this.config.getOrThrow<string>('AWS_REGION'),
    });
  }

  async upload(userId: string, buffer: Buffer, mimeType: string): Promise<string> {
    const ext = MIME_TO_EXT[mimeType] ?? 'jpg';
    const key = `avatars/${userId}.${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: 'max-age=31536000, immutable',
      }),
    );

    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }

  async delete(avatarUrl: string): Promise<void> {
    const url = new URL(avatarUrl);
    const key = url.pathname.slice(1); // remove leading /

    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}
