export interface AvatarStoragePort {
  upload(userId: string, buffer: Buffer, mimeType: string): Promise<string>;
  delete(key: string): Promise<void>;
}

export const AVATAR_STORAGE = Symbol('AvatarStorage');
