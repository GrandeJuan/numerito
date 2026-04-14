import { S3AvatarStorageAdapter } from './s3-avatar-storage.adapter';

const mockSend = jest.fn().mockResolvedValue({});

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  PutObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
  DeleteObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

describe('S3AvatarStorageAdapter', () => {
  let adapter: S3AvatarStorageAdapter;
  const buffer = Buffer.from('fake-image-data');

  const mockConfig = {
    getOrThrow: jest.fn((key: string) => {
      const values: Record<string, string> = {
        AWS_S3_BUCKET: 'my-test-bucket',
        AWS_REGION: 'us-east-1',
      };
      return values[key];
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new S3AvatarStorageAdapter(mockConfig as any);
  });

  describe('upload', () => {
    it('should send PutObjectCommand with correct params for jpeg', async () => {
      const url = await adapter.upload('user-1', buffer, 'image/jpeg');

      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: 'my-test-bucket',
        Key: 'avatars/user-1.jpg',
        Body: buffer,
        ContentType: 'image/jpeg',
        CacheControl: 'max-age=31536000, immutable',
      });
      expect(mockSend).toHaveBeenCalled();
      expect(url).toBe('https://my-test-bucket.s3.amazonaws.com/avatars/user-1.jpg');
    });

    it('should use correct extension for image/png', async () => {
      const url = await adapter.upload('user-1', buffer, 'image/png');
      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: 'avatars/user-1.png',
          ContentType: 'image/png',
        }),
      );
      expect(url).toBe('https://my-test-bucket.s3.amazonaws.com/avatars/user-1.png');
    });

    it('should use correct extension for image/webp', async () => {
      const url = await adapter.upload('user-1', buffer, 'image/webp');
      expect(url).toBe('https://my-test-bucket.s3.amazonaws.com/avatars/user-1.webp');
    });

    it('should default to jpg for unknown mime types', async () => {
      const url = await adapter.upload('user-1', buffer, 'image/tiff');
      expect(url).toBe('https://my-test-bucket.s3.amazonaws.com/avatars/user-1.jpg');
    });
  });

  describe('delete', () => {
    it('should send DeleteObjectCommand with key extracted from URL', async () => {
      await adapter.delete('https://my-test-bucket.s3.amazonaws.com/avatars/user-1.png');

      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'my-test-bucket',
        Key: 'avatars/user-1.png',
      });
      expect(mockSend).toHaveBeenCalled();
    });

    it('should handle URLs with nested paths', async () => {
      await adapter.delete('https://my-test-bucket.s3.amazonaws.com/avatars/deep/user-1.jpg');

      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'my-test-bucket',
        Key: 'avatars/deep/user-1.jpg',
      });
    });
  });
});
