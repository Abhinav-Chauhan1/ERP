# Syllabus Document Management Components

This directory contains all components for managing documents in the enhanced syllabus system.

## Components

### DocumentUploadZone
Drag-and-drop zone for uploading documents with client-side validation.

**Features:**
- Drag-and-drop file upload
- Multiple file selection
- Client-side file type and size validation
- Automatic upload to Cloudinary
- Visual feedback during upload

**Usage:**
```tsx
import { DocumentUploadZone } from "@/components/admin/syllabus";

<DocumentUploadZone
  onFilesSelected={(files) => console.log(files)}
  onUploadError={(error) => console.error(error)}
  multiple={true}
/>
```

### DocumentCard
Displays a single document with metadata, file type icon, and action buttons.

**Features:**
- File type icons (PDF, Word, PowerPoint, Image, Video)
- File size display
- Download and view buttons
- Edit and delete actions
- Drag handle for reordering

**Usage:**
```tsx
import { DocumentCard } from "@/components/admin/syllabus";

<DocumentCard
  document={document}
  onEdit={(doc) => console.log("Edit", doc)}
  onDelete={(id) => console.log("Delete", id)}
  onView={(url) => window.open(url)}
  showActions={true}
  draggable={true}
/>
```

### DocumentList
Displays a list of documents with drag-and-drop reordering capability.

**Features:**
- Grid layout with responsive columns
- Drag-and-drop reordering using react-dnd
- Automatic order persistence
- Visual feedback during drag
- Empty state handling

**Usage:**
```tsx
import { DocumentList } from "@/components/admin/syllabus";

<DocumentList
  documents={documents}
  parentId={moduleId}
  parentType="module"
  onEdit={(doc) => console.log("Edit", doc)}
  onDelete={async (id) => await deleteDocument(id)}
  onReorder={() => console.log("Order changed")}
  enableReordering={true}
/>
```

### DocumentMetadataForm
Dialog form for editing document title and description.

**Features:**
- Form validation with Zod
- React Hook Form integration
- Preserves original file
- Success/error handling

**Usage:**
```tsx
import { DocumentMetadataForm } from "@/components/admin/syllabus";

<DocumentMetadataForm
  document={selectedDocument}
  open={isOpen}
  onOpenChange={setIsOpen}
  onSuccess={() => console.log("Updated")}
/>
```

### BulkDocumentUpload
Dialog for uploading multiple documents with progress tracking.

**Features:**
- Multiple file selection
- Individual file validation
- Progress indicators for each file
- Continues on individual failures
- Success/failure summary
- Scrollable file list

**Usage:**
```tsx
import { BulkDocumentUpload } from "@/components/admin/syllabus";

<BulkDocumentUpload
  open={isOpen}
  onOpenChange={setIsOpen}
  moduleId={moduleId}
  uploadedBy={userId}
  onSuccess={() => console.log("Upload complete")}
/>
```

### DocumentManagement
Main component that combines all document management features.

**Features:**
- Loads documents from server
- Integrates all sub-components
- Handles all CRUD operations
- Automatic refresh after changes
- Error handling and loading states

**Usage:**
```tsx
import { DocumentManagement } from "@/components/admin/syllabus";

<DocumentManagement
  parentId={moduleId}
  parentType="module"
  uploadedBy={userId}
  showActions={true}
  enableReordering={true}
/>
```

## Requirements Coverage

This implementation covers the following requirements:

- **3.1**: Store documents with metadata (filename, file type, file size, timestamp)
- **3.2**: Store documents for both modules and sub-modules
- **3.3**: Maintain document upload order
- **3.4**: Validate file types (PDF, Word, PowerPoint, images, videos)
- **3.5**: Cascade delete documents when parent is deleted
- **3.6**: Remove files from storage and database on delete
- **4.1**: Allow title and description for documents
- **4.2**: Use filename as default title
- **4.3**: Display document metadata
- **4.4**: Update metadata while preserving file
- **4.5**: Reorder documents with drag-and-drop
- **9.1**: Accept multiple valid files in bulk upload
- **9.2**: Display upload progress for each file
- **9.3**: Validate each file individually
- **9.4**: Continue uploading on individual failures

## File Type Support

Supported file types:
- **Documents**: PDF (.pdf), Word (.doc, .docx), PowerPoint (.ppt, .pptx)
- **Images**: JPEG (.jpg, .jpeg), PNG (.png), GIF (.gif), WebP (.webp)
- **Videos**: MP4 (.mp4), WebM (.webm), MOV (.mov)

Maximum file size: 50MB per file

## Dependencies

- `react-dnd` and `react-dnd-html5-backend` for drag-and-drop
- `@hookform/resolvers` and `react-hook-form` for forms
- `zod` for validation
- Cloudinary for file storage
- shadcn/ui components

## Server Actions

The components use the following server actions from `@/lib/actions/syllabusDocumentActions`:

- `validateFileType`: Validate file type and size
- `uploadDocument`: Upload a single document
- `bulkUploadDocuments`: Upload multiple documents
- `updateDocumentMetadata`: Update document title/description
- `deleteDocument`: Delete document from DB and storage
- `reorderDocuments`: Update document order
- `getDocumentsByParent`: Fetch documents for a module/sub-module
