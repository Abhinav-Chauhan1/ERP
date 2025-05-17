export interface CloudinaryUploadWidgetResults {
  event: string;
  info: {
    secure_url: string;
    public_id: string;
    original_filename: string;
    format: string;
    bytes: number;
    resource_type: string;
    url: string;
    path: string;
    thumbnail_url: string;
    asset_id: string;
    api_key: string;
  };
}

export interface CloudinaryUploadWidgetOptions {
  cloudName: string;
  uploadPreset: string;
  folder?: string;
  sources?: string[];
  multiple?: boolean;
  cropping?: boolean;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  clientAllowedFormats?: string[];
  maxFileSize?: number;
  maxImageWidth?: number;
  maxImageHeight?: number;
  minImageWidth?: number;
  minImageHeight?: number;
  theme?: string;
  styles?: Record<string, any>;
}
