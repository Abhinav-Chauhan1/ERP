/**
 * R2 Upload Components
 * 
 * Custom upload components that replace Cloudinary functionality with R2 storage.
 * These components provide comprehensive file upload capabilities with:
 * - Drag and drop functionality
 * - Progress tracking and error handling
 * - File previews and thumbnails
 * - Storage quota checking and warnings
 * - School-aware uploads with data isolation
 */

export { R2UploadWidget } from './r2-upload-widget';
export { R2ImageUpload } from './r2-image-upload';
export { R2DocumentUpload } from './r2-document-upload';

export type {
  UploadResult,
  UploadProgress,
  FilePreview,
  R2UploadWidgetProps,
} from './r2-upload-widget';

export type {
  ImageUploadResult,
  R2ImageUploadProps,
} from './r2-image-upload';

export type {
  DocumentUploadResult,
  DocumentInfo,
  R2DocumentUploadProps,
} from './r2-document-upload';