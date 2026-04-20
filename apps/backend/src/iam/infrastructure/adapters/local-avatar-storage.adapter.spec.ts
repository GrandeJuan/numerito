import { LocalAvatarStorageAdapter } from './local-avatar-storage.adapter';

jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));

import { writeFile, unlink, mkdir } from 'fs/promises';

describe('LocalAvatarStorageAdapter', () => {
  let adapter: LocalAvatarStorageAdapter;
  const buffer = Buffer.from('fake-image-data');

  beforeEach(() => {
    adapter = new LocalAvatarStorageAdapter();
    jest.clearAllMocks();
  });

  describe('upload', () => {
    it('should create the upload directory recursively', async () => {
      await adapter.upload('user-1', buffer, 'image/png');
      expect(mkdir).toHaveBeenCalledWith(expect.stringMatching(/uploads[\\/]avatars/), {
        recursive: true,
      });
    });

    it('should write file with correct extension for image/jpeg', async () => {
      const url = await adapter.upload('user-1', buffer, 'image/jpeg');
      expect(writeFile).toHaveBeenCalledWith(expect.stringContaining('user-1.jpg'), buffer);
      expect(url).toBe('/uploads/avatars/user-1.jpg');
    });

    it('should write file with correct extension for image/png', async () => {
      const url = await adapter.upload('user-1', buffer, 'image/png');
      expect(writeFile).toHaveBeenCalledWith(expect.stringContaining('user-1.png'), buffer);
      expect(url).toBe('/uploads/avatars/user-1.png');
    });

    it('should write file with correct extension for image/webp', async () => {
      const url = await adapter.upload('user-1', buffer, 'image/webp');
      expect(url).toBe('/uploads/avatars/user-1.webp');
    });

    it('should default to jpg for unknown mime types', async () => {
      const url = await adapter.upload('user-1', buffer, 'image/bmp');
      expect(url).toBe('/uploads/avatars/user-1.jpg');
    });

    it('should use userId in the filename', async () => {
      const url = await adapter.upload('abc-123', buffer, 'image/png');
      expect(url).toBe('/uploads/avatars/abc-123.png');
    });
  });

  describe('delete', () => {
    it('should delete the file from the upload directory', async () => {
      await adapter.delete('/uploads/avatars/user-1.png');
      expect(unlink).toHaveBeenCalledWith(expect.stringContaining('user-1.png'));
    });

    it('should handle empty filename gracefully', async () => {
      await adapter.delete('/uploads/avatars/');
      expect(unlink).not.toHaveBeenCalled();
    });

    it('should ignore errors when file does not exist', async () => {
      (unlink as jest.Mock).mockRejectedValueOnce(new Error('ENOENT'));
      await expect(adapter.delete('/uploads/avatars/missing.png')).resolves.not.toThrow();
    });
  });
});
