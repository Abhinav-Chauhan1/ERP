import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handlePhotoUpload } from '../page';
import { uploadHandler } from '@/lib/services/upload-handler';

// Mock dependencies
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    student: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('@/lib/actions/alumniActions', () => ({
  updateAlumniProfile: vi.fn(),
}));

vi.mock('@/lib/cloudinary-server', () => ({
  uploadBufferToCloudinary: vi.fn(),
}));

// Mock server-only context
vi.mock('react', async () => {
    const actual = await vi.importActual('react');
    return {
        ...actual,
        cache: (fn: any) => fn,
    };
});

describe('handlePhotoUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should upload photo successfully', async () => {
    const mockFile = new File(['test image content'], 'test.png', { type: 'image/png' });
    // Mock arrayBuffer since jsdom/node environment might not implement it fully on File object in tests
    mockFile.arrayBuffer = vi.fn().mockResolvedValue(Buffer.from('test image content'));

    const mockResult = {
      secure_url: 'https://example.com/photo.png',
      public_id: '123',
    };

    (uploadBufferToCloudinary as any).mockResolvedValue(mockResult);

    const result = await handlePhotoUpload(mockFile);

    expect(result).toEqual({
      success: true,
      url: 'https://example.com/photo.png',
    });

    // Check if uploadBufferToCloudinary was called correctly
    expect(uploadBufferToCloudinary).toHaveBeenCalled();
    const [buffer, options] = (uploadBufferToCloudinary as any).mock.calls[0];
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(options).toEqual({
      folder: 'alumni-profiles',
      resource_type: 'image',
    });
  });

  it('should return error if file is not provided', async () => {
    // @ts-ignore
    const result = await handlePhotoUpload(null);

    expect(result).toEqual({
      success: false,
      error: 'No file provided',
    });
  });

  it('should return error if file is not an image', async () => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const result = await handlePhotoUpload(mockFile);

    expect(result).toEqual({
      success: false,
      error: 'File must be an image',
    });
  });

  it('should return error if file size is too large', async () => {
    // Create a large file
    const largeContent = new Array(5 * 1024 * 1024 + 10).fill('a').join('');
    const mockFile = new File([largeContent], 'large.png', { type: 'image/png' });

    // We mock the size property since jsdom File might not calculate it correctly from string
    Object.defineProperty(mockFile, 'size', { value: 5 * 1024 * 1024 + 1 });

    const result = await handlePhotoUpload(mockFile);

    expect(result).toEqual({
      success: false,
      error: 'File size must be less than 5MB',
    });
  });

  it('should return error if upload fails', async () => {
    const mockFile = new File(['test image content'], 'test.png', { type: 'image/png' });
    mockFile.arrayBuffer = vi.fn().mockResolvedValue(Buffer.from('test image content'));

    (uploadBufferToCloudinary as any).mockRejectedValue(new Error('Upload failed'));

    const result = await handlePhotoUpload(mockFile);

    expect(result).toEqual({
      success: false,
      error: 'Upload failed',
    });
  });
});
