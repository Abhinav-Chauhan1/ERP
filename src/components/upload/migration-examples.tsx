/**
 * Migration Examples: Cloudinary to R2 Upload Components
 * 
 * This file shows how to replace CldUploadWidget with R2 upload components.
 * These examples demonstrate the migration patterns for different use cases.
 */

import React, { useState } from 'react';
import { R2UploadWidget, R2ImageUpload, R2DocumentUpload } from './index';
import type { UploadResult, ImageUploadResult, DocumentUploadResult, DocumentInfo } from './index';

/**
 * Example 1: Basic File Upload (replaces CldUploadWidget)
 * 
 * BEFORE (Cloudinary):
 * <CldUploadWidget 
 *   uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
 *   onSuccess={handleUploadSuccess}
 * >
 *   {({ open }) => (
 *     <div onClick={() => open()}>
 *       <Upload className="h-10 w-10" />
 *       <p>Click to upload files</p>
 *     </div>
 *   )}
 * </CldUploadWidget>
 */
export function BasicUploadExample() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([]);

  const handleUploadSuccess = (result: UploadResult) => {
    console.log('File uploaded:', result);
    setUploadedFiles(prev => [...prev, result]);
  };

  const handleUploadError = (error: string) => {
    console.error('Upload failed:', error);
  };

  return (
    <R2UploadWidget
      onSuccess={handleUploadSuccess}
      onError={handleUploadError}
      folder="assignments"
      maxFiles={5}
      accept={['image/*', 'application/pdf', 'application/msword']}
      uploadText="Click to upload files"
      descriptionText="Upload PDF, Word, Excel, or image files"
    />
  );
}

/**
 * Example 2: Image Upload with Preview (replaces image-specific CldUploadWidget)
 * 
 * BEFORE (Cloudinary):
 * <CldUploadWidget 
 *   uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
 *   onSuccess={(result) => setImageUrl(result.info.secure_url)}
 * >
 *   {({ open }) => (
 *     <div onClick={() => open()}>
 *       {imageUrl ? (
 *         <img src={imageUrl} alt="Uploaded" />
 *       ) : (
 *         <div>Click to upload image</div>
 *       )}
 *     </div>
 *   )}
 * </CldUploadWidget>
 */
export function ImageUploadExample() {
  const [imageUrl, setImageUrl] = useState<string>('');

  const handleImageUpload = (result: ImageUploadResult) => {
    console.log('Image uploaded:', result);
  };

  return (
    <R2ImageUpload
      value={imageUrl}
      onChange={setImageUrl}
      onSuccess={handleImageUpload}
      folder="profile-images"
      label="Profile Picture"
      width={200}
      height={200}
      generateThumbnails={true}
    />
  );
}

/**
 * Example 3: Document Upload with File List
 * 
 * BEFORE (Cloudinary):
 * Multiple CldUploadWidget instances or complex state management
 */
export function DocumentUploadExample() {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);

  const handleDocumentUpload = (result: DocumentUploadResult) => {
    console.log('Document uploaded:', result);
  };

  return (
    <R2DocumentUpload
      value={documents}
      onChange={setDocuments}
      onSuccess={handleDocumentUpload}
      folder="lesson-materials"
      label="Lesson Documents"
      maxFiles={10}
      accept={[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ]}
      uploadText="Upload lesson documents"
      descriptionText="Drag and drop PDF or Word documents here"
    />
  );
}

/**
 * Example 4: Assignment Upload (from teacher assignments page)
 * 
 * This shows how to replace the CldUploadWidget in teacher assignment creation
 */
export function AssignmentUploadExample() {
  const [attachments, setAttachments] = useState<{
    name: string;
    url: string;
    size: number;
    type: string;
  }[]>([]);

  const handleUploadSuccess = (result: UploadResult) => {
    if (result.success && result.url && result.metadata) {
      const fileInfo = {
        name: result.metadata.originalName,
        url: result.url,
        size: result.metadata.size,
        type: result.metadata.mimeType,
      };
      
      setAttachments(prev => [...prev, fileInfo]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <R2UploadWidget
        onSuccess={handleUploadSuccess}
        folder="assignments"
        maxFiles={10}
        accept={[
          'image/*',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]}
        uploadText="Click to upload files"
        descriptionText="Upload PDF, Word, Excel, or image files"
        showPreviews={false} // We'll show our own list
      />

      {/* Custom attachment list (matching original design) */}
      {attachments.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Uploaded Files:</p>
          <div className="space-y-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-gray-500">({Math.round(file.size / 1024)} KB)</span>
                </div>
                <button 
                  type="button"
                  onClick={() => handleRemoveAttachment(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Migration Guide Component
 * 
 * This component provides a comprehensive guide for migrating from Cloudinary to R2
 */
export function MigrationGuide() {
  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-4">Cloudinary to R2 Migration Guide</h1>
        <p className="text-gray-600 mb-6">
          This guide shows how to replace CldUploadWidget components with R2 upload components.
        </p>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-3">1. Basic File Upload</h2>
          <p className="text-gray-600 mb-4">
            Replace simple CldUploadWidget with R2UploadWidget for general file uploads.
          </p>
          <BasicUploadExample />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">2. Image Upload with Preview</h2>
          <p className="text-gray-600 mb-4">
            Use R2ImageUpload for image-specific uploads with preview functionality.
          </p>
          <ImageUploadExample />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">3. Document Upload with File List</h2>
          <p className="text-gray-600 mb-4">
            Use R2DocumentUpload for document uploads with file management.
          </p>
          <DocumentUploadExample />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">4. Assignment Upload (Real Example)</h2>
          <p className="text-gray-600 mb-4">
            This shows how to replace the CldUploadWidget in teacher assignment pages.
          </p>
          <AssignmentUploadExample />
        </section>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Key Benefits of R2 Components</h3>
        <ul className="space-y-2 text-sm">
          <li>✅ <strong>School Isolation:</strong> Automatic school-based folder structure</li>
          <li>✅ <strong>Quota Management:</strong> Built-in storage quota checking and warnings</li>
          <li>✅ <strong>Progress Tracking:</strong> Real-time upload progress with error handling</li>
          <li>✅ <strong>File Validation:</strong> Comprehensive file type and size validation</li>
          <li>✅ <strong>Drag & Drop:</strong> Modern drag-and-drop interface</li>
          <li>✅ <strong>Thumbnails:</strong> Automatic thumbnail generation for images</li>
          <li>✅ <strong>Security:</strong> CSRF protection and secure uploads</li>
          <li>✅ <strong>Cost Effective:</strong> Zero egress fees with Cloudflare R2</li>
        </ul>
      </div>

      <div className="bg-yellow-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Migration Checklist</h3>
        <ul className="space-y-2 text-sm">
          <li>□ Replace all CldUploadWidget imports with R2 components</li>
          <li>□ Update upload success handlers to use new result format</li>
          <li>□ Remove Cloudinary environment variables from forms</li>
          <li>□ Test file uploads in all affected pages</li>
          <li>□ Verify storage quota warnings work correctly</li>
          <li>□ Check that school isolation is working properly</li>
          <li>□ Update any file URL references in the database</li>
        </ul>
      </div>
    </div>
  );
}