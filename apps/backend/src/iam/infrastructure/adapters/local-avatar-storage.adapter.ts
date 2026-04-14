import { Injectable } from '@nestjs/common';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import type { AvatarStoragePort } from '../../domain/ports/avatar-storage.port';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class LocalAvatarStorageAdapter implements AvatarStoragePort {
  private readonly uploadDir = join(process.cwd(), 'uploads', 'avatars');

  async upload(userId: string, buffer: Buffer, mimeType: string): Promise<string> {
    await mkdir(this.uploadDir, { recursive: true });
    const ext = MIME_TO_EXT[mimeType] ?? 'jpg';
    const filename = `${userId}.${ext}`;
    await writeFile(join(this.uploadDir, filename), buffer);
    return `/uploads/avatars/${filename}`;
  }

  async delete(avatarUrl: string): Promise<void> {
    const filename = avatarUrl.split('/').pop();
    if (!filename) return;
    try {
      await unlink(join(this.uploadDir, filename));
    } catch {
      // File may not exist, ignore
    }
  }
}
