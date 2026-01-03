# Enhanced Syllabus System - Admin User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Module Management](#module-management)
4. [Sub-Module Management](#sub-module-management)
5. [Document Management](#document-management)
6. [Reordering Content](#reordering-content)
7. [Best Practices](#best-practices)
8. [Common Tasks](#common-tasks)

## Introduction

The Enhanced Syllabus System provides a structured, chapter-wise approach to organizing curriculum content. As an admin user, you have full control over creating, editing, and organizing modules, sub-modules, and documents.

### Key Features
- **Chapter-wise organization**: Organize content by chapters with explicit numbering
- **Hierarchical structure**: Syllabus → Modules (Chapters) → Sub-Modules (Topics) → Documents
- **Multiple document attachments**: Attach multiple files at both module and sub-module levels
- **Drag-and-drop reordering**: Easily reorganize content with intuitive drag-and-drop
- **Bulk operations**: Upload multiple documents at once

## Getting Started

### Accessing the Syllabus Management

1. Log in to the admin dashboard
2. Navigate to **Academic** → **Teaching** → **Syllabus**
3. Select a subject to view or edit its syllabus
4. Click **Manage Modules** to access the enhanced syllabus editor

### Understanding the Interface

The syllabus management interface consists of:
- **Module List**: Accordion-style list of all chapters
- **Action Buttons**: Create, edit, delete, and reorder controls
- **Document Upload Area**: Drag-and-drop zone for file uploads
- **Progress Indicators**: Visual feedback for bulk operations

## Module Management

### Creating a Module (Chapter)

1. Click the **Add Module** button
2. Fill in the module details:
   - **Title**: Name of the chapter (e.g., "Introduction to Algebra")
   - **Description**: Brief overview of the chapter content
   - **Chapter Number**: Unique number for this chapter (e.g., 1, 2, 3)
   - **Order**: Display order (usually same as chapter number)
3. Click **Create Module**

**Important**: Chapter numbers must be unique within a syllabus.

### Editing a Module

1. Click the **Edit** icon next to the module
2. Update the desired fields
3. Click **Save Changes**

**Note**: Editing a module preserves all associated sub-modules and documents.

### Deleting a Module

1. Click the **Delete** icon next to the module
2. Confirm the deletion in the dialog

**Warning**: Deleting a module will permanently delete all associated sub-modules and documents. This action cannot be undone.

### Module Fields

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| Title | Yes | Name of the chapter | "Linear Equations" |
| Description | No | Overview of chapter content | "Introduction to solving linear equations" |
| Chapter Number | Yes | Unique chapter identifier | 3 |
| Order | Yes | Display sequence | 3 |

## Sub-Module Management

### Creating a Sub-Module (Topic)

1. Expand a module by clicking on it
2. Click the **Add Sub-Module** button within the module
3. Fill in the sub-module details:
   - **Title**: Name of the topic (e.g., "Solving One-Variable Equations")
   - **Description**: Brief overview of the topic
   - **Order**: Display order within the module
4. Click **Create Sub-Module**

### Editing a Sub-Module

1. Click the **Edit** icon next to the sub-module
2. Update the desired fields
3. Click **Save Changes**

### Deleting a Sub-Module

1. Click the **Delete** icon next to the sub-module
2. Confirm the deletion

**Warning**: Deleting a sub-module will permanently delete all associated documents.

### Moving Sub-Modules Between Modules

You can move a sub-module from one module to another:

1. Click and hold the drag handle on the sub-module
2. Drag it to the target module
3. Release to drop it in the new location

The system will automatically update the parent-child relationship.

## Document Management

### Supported File Types

The system supports the following file types:

**Documents**:
- PDF (.pdf)
- Microsoft Word (.doc, .docx)
- Microsoft PowerPoint (.ppt, .pptx)

**Images**:
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

**Videos**:
- MP4 (.mp4)
- WebM (.webm)
- MOV (.mov)

**File Size Limit**: 50MB per file

### Uploading a Single Document

1. Navigate to the module or sub-module where you want to add a document
2. Click the **Upload Document** button
3. Select a file from your computer
4. Fill in the document details:
   - **Title**: Document name (defaults to filename if not provided)
   - **Description**: Brief description of the document content
5. Click **Upload**

### Bulk Uploading Documents

For uploading multiple documents at once:

1. Click the **Bulk Upload** button
2. Select multiple files from your computer (or drag and drop them)
3. The system will:
   - Validate each file type and size
   - Show upload progress for each file
   - Display success/failure status for each upload
4. Review the upload summary

**Note**: If one file fails, the remaining files will continue to upload.

### Editing Document Metadata

1. Click the **Edit** icon next to the document
2. Update the title or description
3. Click **Save**

**Note**: Editing metadata does not affect the original file.

### Deleting Documents

1. Click the **Delete** icon next to the document
2. Confirm the deletion

**Warning**: This permanently removes the file from both the database and cloud storage.

### Reordering Documents

1. Click and hold the drag handle on a document
2. Drag it to the desired position
3. Release to drop it in the new location

Documents are displayed in the order you set.

## Reordering Content

### Reordering Modules

1. Click and hold the drag handle on a module
2. Drag it to the desired position
3. Release to drop it in the new location

**Note**: The system automatically updates the order values for all affected modules.

### Reordering Sub-Modules Within a Module

1. Expand the module
2. Click and hold the drag handle on a sub-module
3. Drag it to the desired position within the same module
4. Release to drop it in the new location

### Moving Sub-Modules Between Modules

1. Click and hold the drag handle on a sub-module
2. Drag it to a different module
3. Release to drop it in the new module

The system updates both the parent relationship and the order.

## Best Practices

### Organizing Content

1. **Use clear, descriptive titles**: Make it easy for teachers and students to understand the content
2. **Number chapters sequentially**: Use 1, 2, 3, etc. for chapter numbers
3. **Group related topics**: Place related sub-modules within the same module
4. **Provide descriptions**: Add descriptions to help users understand the content at a glance

### Document Management

1. **Use descriptive filenames**: Name files clearly before uploading
2. **Add titles and descriptions**: Provide context for each document
3. **Organize by relevance**: Place documents at the appropriate level (module vs. sub-module)
4. **Check file sizes**: Compress large files before uploading (50MB limit)
5. **Use appropriate formats**: PDF for documents, MP4 for videos

### Maintaining Structure

1. **Plan before creating**: Outline your syllabus structure before adding content
2. **Review regularly**: Periodically review and update content
3. **Test navigation**: Verify that the structure makes sense from a user perspective
4. **Backup important files**: Keep local copies of critical documents

## Common Tasks

### Creating a Complete Syllabus

1. Create all modules (chapters) with sequential chapter numbers
2. For each module:
   - Add sub-modules (topics)
   - Upload relevant documents
3. Review the structure and reorder as needed
4. Add descriptions to provide context

### Updating Existing Content

1. Navigate to the module or sub-module
2. Click the edit icon
3. Update the content
4. Save changes

### Reorganizing a Syllabus

1. Use drag-and-drop to reorder modules
2. Move sub-modules between modules as needed
3. Reorder documents within modules/sub-modules
4. Review the final structure

### Adding Resources to Multiple Topics

1. Use bulk upload to add multiple documents at once
2. Organize documents by module/sub-module
3. Add titles and descriptions for clarity

### Removing Outdated Content

1. Identify outdated modules, sub-modules, or documents
2. Delete them using the delete icon
3. Confirm the deletion
4. Verify the structure still makes sense

## Tips and Tricks

### Keyboard Shortcuts

- **Ctrl/Cmd + Click**: Select multiple items (future feature)
- **Escape**: Close dialogs and modals
- **Tab**: Navigate between form fields

### Visual Indicators

- **Drag Handle**: Six dots icon indicates draggable items
- **Loading Spinner**: Indicates an operation in progress
- **Progress Bar**: Shows upload progress for files
- **Success/Error Messages**: Confirm actions or indicate issues

### Performance Tips

1. **Compress images**: Reduce file sizes before uploading
2. **Use pagination**: For syllabi with many modules, use pagination
3. **Bulk operations**: Upload multiple files at once instead of one by one
4. **Cache clearing**: Refresh the page if content doesn't update

## Troubleshooting

See the [Troubleshooting Guide](./ENHANCED_SYLLABUS_TROUBLESHOOTING.md) for common issues and solutions.

## Support

If you encounter issues not covered in this guide:
1. Check the troubleshooting guide
2. Contact your system administrator
3. Review the API documentation for technical details

---

**Last Updated**: December 2024  
**Version**: 1.0
