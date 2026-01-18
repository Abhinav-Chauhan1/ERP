import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadBufferToCloudinary } from '../cloudinary-server';

// Mock cloudinary
vi.mock('cloudinary', () => {
  return {
    v2: {
      config: vi.fn(),
      uploader: {
        upload_stream: vi.fn(),
      },
    },
  };
});

describe('cloudinary-server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uploadBufferToCloudinary uploads buffer and returns result', async () => {
    const mockBuffer = Buffer.from('test image content');
    const mockResult = {
      secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg',
      public_id: 'sample',
      resource_type: 'image',
      format: 'jpg',
      width: 100,
      height: 100,
      bytes: 1024,
      original_filename: 'sample',
    };

    const { v2: cloudinary } = await import('cloudinary');

    // Mock upload_stream implementation
    (cloudinary.uploader.upload_stream as any).mockImplementation(
      (options: any, callback: any) => {
        // Simulate successful upload
        callback(null, mockResult);
        return {
          end: vi.fn(),
        };
      }
    );

    const result = await uploadBufferToCloudinary(mockBuffer, {
        folder: 'test-folder'
    });

    expect(cloudinary.config).toHaveBeenCalled();
    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      expect.objectContaining({
        folder: 'test-folder',
        resource_type: 'auto',
      }),
      expect.any(Function)
    );
    expect(result).toEqual(mockResult);
  });

  it('uploadBufferToCloudinary handles errors', async () => {
    const mockBuffer = Buffer.from('test image content');
    const mockError = new Error('Upload failed');

    const { v2: cloudinary } = await import('cloudinary');

    // Mock upload_stream implementation to simulate error
    (cloudinary.uploader.upload_stream as any).mockImplementation(
      (options: any, callback: any) => {
        callback(mockError, null);
        return {
          end: vi.fn(),
        };
      }
    );

    await expect(uploadBufferToCloudinary(mockBuffer)).rejects.toThrow('Upload failed');
  });
});
