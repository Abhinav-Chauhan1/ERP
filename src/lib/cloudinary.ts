/**
 * Utility for uploading files to Cloudinary
 */

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
  original_filename: string;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  resource_type?: string;
  transformation?: string | object;
  publicId?: string;
}

/**
 * Uploads a file to Cloudinary
 * @param file The file to upload
 * @param options Upload options or a string representing the folder
 * @returns The Cloudinary upload result
 */
export async function uploadToCloudinary(
  file: File,
  options: CloudinaryUploadOptions | string = {}
): Promise<CloudinaryUploadResult> {
  try {
    // Handle string parameter (for backward compatibility)
    if (typeof options === 'string') {
      options = { folder: options };
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Add Cloudinary upload presets and options
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'erp_uploads');
    
    // Handle folder structure
    if (options.folder) {
      formData.append('folder', options.folder);
    }
    
    // Set resource type (auto, image, video, raw)
    const resourceType = options.resource_type || 'auto';
    formData.append('resource_type', resourceType);
    
    // Add custom public ID if provided
    if (options.publicId) {
      formData.append('public_id', options.publicId);
    }
    
    // Add transformation if provided
    if (options.transformation) {
      formData.append('transformation', 
        typeof options.transformation === 'string' 
          ? options.transformation 
          : JSON.stringify(options.transformation)
      );
    }

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`;
    
    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

/**
 * Creates a thumbnail URL from a Cloudinary URL
 * @param url The original Cloudinary URL
 * @param width The width of the thumbnail
 * @returns The thumbnail URL
 */
export function getCloudinaryThumb(url: string, width = 100): string {
  if (!url || !url.includes('cloudinary')) return url;
  
  // Convert full URL to thumbnail URL
  return url.replace('/upload/', `/upload/w_${width},c_scale/`);
}

/**
 * Gets the PDF thumbnail URL from a Cloudinary PDF URL
 * @param url The Cloudinary PDF URL
 * @param width The width of the thumbnail
 * @returns The PDF thumbnail URL
 */
export function getCloudinaryPdfThumb(url: string, width = 200): string {
  if (!url || !url.includes('cloudinary')) return url;
  
  // For PDFs, need to use page 1 and convert to JPG
  return url.replace('/upload/', `/upload/w_${width},pg_1/`);
}

/**
 * Extract the public ID from a Cloudinary URL
 * @param url The Cloudinary URL
 * @returns The public ID or null if not a Cloudinary URL
 */
export function getCloudinaryPublicId(url: string): string | null {
  if (!url || !url.includes('cloudinary')) return null;
  
  // Extract the full path after the upload part
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
  if (match && match[1]) {
    return match[1];
  }
  
  return null;
}

/**
 * Delete a file from Cloudinary
 * @param publicId The public ID of the file to delete
 * @param resourceType The resource type (image, video, raw)
 * @returns The Cloudinary delete result
 */
export async function deleteFromCloudinary(publicId: string, resourceType = 'image'): Promise<any> {
  try {
    if (!publicId) throw new Error('No public ID provided');
    
    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '');
    // Note: For security, server-side deletion should be implemented instead
    
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/resources/${resourceType}`;
    
    const response = await fetch(cloudinaryUrl, {
      method: 'DELETE',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
}

/**
 * Determine the resource type from a file's MIME type
 * @param fileType The MIME type of the file
 * @returns The Cloudinary resource type
 */
export function getResourceType(fileType: string): string {
  if (fileType.startsWith('image/')) return 'image';
  if (fileType.startsWith('video/')) return 'video';
  return 'raw';
}

/**
 * Format a Cloudinary URL with custom transformations
 * @param url The original Cloudinary URL
 * @param transformations The transformations to apply
 * @returns The transformed URL
 */
export function transformCloudinaryUrl(url: string, transformations: string): string {
  if (!url || !url.includes('cloudinary')) return url;
  
  return url.replace('/upload/', `/upload/${transformations}/`);
}
