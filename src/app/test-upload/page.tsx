"use client";

import React, { useState } from 'react';
import { R2UploadWidget, R2ImageUpload, R2DocumentUpload } from '@/components/upload';
import type { UploadResult, ImageUploadResult, DocumentUploadResult, DocumentInfo } from '@/components/upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Test page for R2 upload components
 * This page demonstrates the new R2 upload components that replace CldUploadWidget
 */
export default function TestUploadPage() {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([]);

  const handleUploadSuccess = (result: UploadResult) => {
    console.log('File uploaded:', result);
    setUploadedFiles(prev => [...prev, result]);
  };

  const handleImageUpload = (result: ImageUploadResult) => {
    console.log('Image uploaded:', result);
  };

  const handleDocumentUpload = (result: DocumentUploadResult) => {
    console.log('Document uploaded:', result);
  };

  const handleUploadError = (error: string) => {
    console.error('Upload failed:', error);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">R2 Upload Components Test</h1>
        <p className="text-gray-600 mb-8">
          Testing the new R2 upload components that replace CldUploadWidget.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        {/* General File Upload */}
        <Card>
          <CardHeader>
            <CardTitle>General File Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <R2UploadWidget
              onSuccess={handleUploadSuccess}
              onError={handleUploadError}
              folder="test-uploads"
              maxFiles={5}
              accept={['image/*', 'application/pdf', 'application/msword']}
              uploadText="Click to upload files"
              descriptionText="Upload PDF, Word, or image files"
            />
            
            {uploadedFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Uploaded Files:</h4>
                <ul className="space-y-1 text-sm">
                  {uploadedFiles.map((file, index) => (
                    <li key={index} className="text-green-600">
                      ✓ {file.metadata?.originalName} - {file.url}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Image Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Image Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <R2ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              onSuccess={handleImageUpload}
              onError={handleUploadError}
              folder="test-images"
              label="Test Image"
              width={200}
              height={200}
              generateThumbnails={true}
            />
          </CardContent>
        </Card>

        {/* Document Upload */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Document Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <R2DocumentUpload
              value={documents}
              onChange={setDocuments}
              onSuccess={handleDocumentUpload}
              onError={handleUploadError}
              folder="test-documents"
              label="Test Documents"
              maxFiles={5}
              accept={[
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              ]}
              uploadText="Upload test documents"
              descriptionText="Drag and drop PDF or Word documents here"
            />
          </CardContent>
        </Card>
      </div>

      {/* Component Status */}
      <Card>
        <CardHeader>
          <CardTitle>Component Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800">R2UploadWidget</h4>
              <p className="text-sm text-green-600">✓ Ready</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800">R2ImageUpload</h4>
              <p className="text-sm text-green-600">✓ Ready</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800">R2DocumentUpload</h4>
              <p className="text-sm text-green-600">✓ Ready</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Migration Complete</h4>
            <p className="text-sm text-blue-600">
              All R2 upload components are ready to replace CldUploadWidget instances.
              The components provide enhanced functionality including:
            </p>
            <ul className="text-sm text-blue-600 mt-2 space-y-1">
              <li>• School-based data isolation</li>
              <li>• Storage quota checking and warnings</li>
              <li>• Drag and drop functionality</li>
              <li>• Progress tracking and error handling</li>
              <li>• File previews and thumbnails</li>
              <li>• CSRF protection and security</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}