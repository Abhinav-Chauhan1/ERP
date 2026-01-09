# Enhanced Syllabus Scope System - User Guide

## Overview

The Enhanced Syllabus Scope System provides flexible curriculum management at multiple organizational levels. This guide explains how to use the system effectively for different user roles.

## Table of Contents

- [Getting Started](#getting-started)
- [Understanding Scope Levels](#understanding-scope-levels)
- [Creating Syllabi](#creating-syllabi)
- [Managing Syllabi](#managing-syllabi)
- [Viewing Syllabi](#viewing-syllabi)
- [Advanced Features](#advanced-features)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### User Roles

The system supports three main user roles:

1. **Admin**: Full access to create, edit, delete, and manage syllabi
2. **Teacher**: View published syllabi and track progress
3. **Student**: View published syllabi assigned to their class/section

### Accessing the System

1. Navigate to **Admin Dashboard** → **Academic** → **Syllabus Management**
2. You'll see a list of existing syllabi with filtering options
3. Click **Create New Syllabus** to add a new curriculum

---

## Understanding Scope Levels

The system supports three scope levels for syllabus creation:

### 1. Subject-Wide Syllabus

**When to use:** General curriculum applicable to all classes and sections

**Characteristics:**
- No class or section specified
- Applies to all students taking the subject
- Useful for standardized curricula

**Example:** A general "Mathematics" syllabus used across all grades

### 2. Class-Wide Syllabus

**When to use:** Curriculum specific to a grade level but common across sections

**Characteristics:**
- Requires class selection
- Applies to all sections within that class
- Useful for grade-specific content

**Example:** "Grade 10 Mathematics" applicable to all Grade 10 sections

### 3. Section-Specific Syllabus

**When to use:** Specialized curriculum for a particular section

**Characteristics:**
- Requires both class and section selection
- Applies only to that specific section
- Useful for advanced, remedial, or specialized sections

**Example:** "Advanced Mathematics - Section A" for high-performing students

### Scope Priority

When a student or teacher requests a syllabus, the system automatically finds the most specific match:

```
Section-Specific > Class-Wide > Subject-Wide
```

**Example:**
- Student in Grade 10, Section A requests Mathematics
- System checks: Section A syllabus → Grade 10 syllabus → General Math syllabus
- Returns the first match found

---

## Creating Syllabi

### Step 1: Basic Information

1. Click **Create New Syllabus**
2. Enter **Title** (e.g., "Advanced Mathematics - Grade 10")
3. Add **Description** (optional but recommended)
4. Select **Subject** from dropdown

### Step 2: Select Scope

Choose the appropriate scope level:

#### For Subject-Wide:
1. Select **Subject-Wide** radio button
2. No additional selections needed
3. Optionally select **Academic Year** (leave blank for all years)

#### For Class-Wide:
1. Select **Class-Wide** radio button
2. Choose **Academic Year** (recommended)
3. Select **Class** from dropdown
4. Section field will be disabled (applies to all sections)

#### For Section-Specific:
1. Select **Section-Specific** radio button
2. Choose **Academic Year** (recommended)
3. Select **Class** from dropdown
4. Select **Section** from dropdown

### Step 3: Curriculum Details

1. **Curriculum Type**: Choose from:
   - **General**: Standard curriculum (default)
   - **Advanced**: For high-performing students
   - **Remedial**: For students needing extra support
   - **Integrated**: Cross-subject curriculum
   - **Vocational**: Career-focused curriculum
   - **Special Needs**: Adapted curriculum

2. **Board Type** (optional): Select educational board
   - CBSE
   - ICSE
   - State Board
   - IB
   - Cambridge
   - Other

### Step 4: Metadata

1. **Version**: Enter version number (default: "1.0")
2. **Difficulty Level**: Select from Beginner, Intermediate, Advanced, Expert
3. **Estimated Hours**: Enter total curriculum hours
4. **Tags**: Add searchable tags (e.g., "algebra", "geometry")
5. **Prerequisites**: Describe required prior knowledge

### Step 5: Scheduling (Optional)

1. **Effective From**: Set activation date
2. **Effective To**: Set expiration date
3. Leave blank for permanent syllabi

### Step 6: Document Upload (Optional)

1. Click **Upload Document**
2. Select PDF or document file
3. File will be stored securely in Cloudinary

### Step 7: Save

1. Click **Save as Draft** to save without publishing
2. Or click **Save and Publish** to make immediately available

---

## Managing Syllabi

### Viewing Syllabus List

The syllabus list shows:
- Title and description
- Subject name
- Scope information (class, section if applicable)
- Curriculum type and board
- Status badge
- Action buttons

### Filtering Syllabi

Use the filter panel to narrow results:

1. **By Subject**: Select subject from dropdown
2. **By Academic Year**: Filter by year
3. **By Class**: Show syllabi for specific grade
4. **By Section**: Show section-specific syllabi
5. **By Curriculum Type**: Filter by curriculum type
6. **By Status**: Show draft, published, archived, etc.
7. **By Tags**: Search by tags

**Tip:** Combine multiple filters for precise results

### Editing Syllabi

1. Click **Edit** button on syllabus card
2. Modify any fields as needed
3. Click **Save Changes**
4. System tracks who made changes and when

### Changing Status

Syllabi follow a lifecycle workflow:

```
DRAFT → PENDING_REVIEW → APPROVED → PUBLISHED → ARCHIVED
```

**To change status:**
1. Click **Status** dropdown on syllabus card
2. Select new status
3. Confirm the change

**Status Meanings:**
- **Draft**: Work in progress, visible only to creator and admins
- **Pending Review**: Submitted for approval
- **Approved**: Approved but not yet published
- **Published**: Active and visible to teachers/students
- **Archived**: Historical record, not shown in active lists
- **Deprecated**: Old version, replaced by newer version

### Cloning Syllabi

Clone existing syllabi to save time:

1. Open syllabus detail page
2. Click **Clone** button
3. Modify scope parameters:
   - Change class
   - Change section
   - Change academic year
4. Click **Create Clone**
5. New syllabus created as DRAFT with all content copied

**Use cases:**
- Copy syllabus to new academic year
- Create section-specific version from class-wide
- Adapt syllabus for different curriculum type

### Deleting Syllabi

1. Click **Delete** button on syllabus card
2. Confirm deletion
3. Syllabus is soft-deleted (marked inactive but preserved)

**Note:** Deleted syllabi can be restored by admins if needed

---

## Viewing Syllabi

### For Teachers

1. Navigate to **Teacher Dashboard** → **Syllabus**
2. View syllabi for your assigned subjects and classes
3. System automatically shows most relevant syllabus
4. Track progress through units and modules
5. Download syllabus documents

### For Students

1. Navigate to **Student Dashboard** → **Syllabus**
2. View syllabi for your enrolled subjects
3. System shows syllabus specific to your class and section
4. View learning objectives and estimated hours
5. Download syllabus documents

### Syllabus Details Page

The detail page shows:
- Complete syllabus information
- Scope and curriculum details
- Units and modules breakdown
- Learning objectives
- Estimated hours per unit
- Prerequisites
- Document downloads
- Version history

---

## Advanced Features

### Version Management

Track curriculum evolution over time:

1. **Creating New Version:**
   - Open existing syllabus
   - Click **Create New Version**
   - Increment version number (e.g., 1.0 → 1.1)
   - Make changes
   - Save as new version

2. **Viewing Version History:**
   - Open syllabus detail page
   - Click **Version History** tab
   - See all versions with dates and changes
   - Compare versions side-by-side

3. **Deprecating Old Versions:**
   - When publishing new version
   - Mark old version as DEPRECATED
   - Old version remains accessible but flagged

### Effective Date Scheduling

Schedule syllabus activation and expiration:

1. **Scheduled Activation:**
   - Set **Effective From** to future date
   - Syllabus won't appear until that date
   - Useful for planning next semester

2. **Automatic Expiration:**
   - Set **Effective To** to end date
   - Syllabus automatically expires
   - Useful for time-limited curricula

3. **Current Date Filtering:**
   - System automatically filters by current date
   - Only active syllabi shown to users
   - Expired syllabi archived automatically

### Tag-Based Organization

Use tags for better organization:

1. **Adding Tags:**
   - Enter tags during creation/editing
   - Use consistent naming (lowercase, hyphenated)
   - Examples: "algebra", "grade-10", "cbse-2024"

2. **Searching by Tags:**
   - Use tag filter in syllabus list
   - Select multiple tags for AND search
   - Find related syllabi quickly

3. **Tag Best Practices:**
   - Use topic tags: "algebra", "geometry", "calculus"
   - Use grade tags: "grade-9", "grade-10"
   - Use board tags: "cbse", "icse"
   - Use year tags: "2024-25"

### Coverage Reports

View curriculum coverage across your institution:

1. Navigate to **Reports** → **Syllabus Coverage**
2. Select academic year
3. View matrix showing:
   - Which classes have syllabi
   - Which sections have specific syllabi
   - Gaps in coverage
4. Export report as PDF or Excel

---

## Troubleshooting

### Common Issues

#### "A syllabus already exists for this combination"

**Cause:** Attempting to create duplicate scope combination

**Solution:**
- Check existing syllabi for same subject + class + section + curriculum type
- Modify scope parameters (different section, curriculum type, or academic year)
- Or edit the existing syllabus instead

#### "Section-specific syllabus requires both class and section selection"

**Cause:** Selected section-specific but didn't choose class or section

**Solution:**
- Select both class and section from dropdowns
- Or change scope type to class-wide or subject-wide

#### "Effective end date must be after start date"

**Cause:** Effective To date is before Effective From date

**Solution:**
- Correct the date range
- Or leave both blank for permanent syllabus

#### "The selected class does not exist"

**Cause:** Referenced class was deleted or doesn't exist

**Solution:**
- Refresh the page to reload dropdown options
- Select a valid class from the list
- Contact admin if class is missing

#### Syllabus not appearing for students

**Possible causes:**
1. Status is not PUBLISHED
2. isActive is false
3. Current date is outside effective date range
4. Scope doesn't match student's class/section

**Solution:**
- Check syllabus status and set to PUBLISHED
- Verify effective dates include current date
- Verify scope matches student's enrollment

#### Can't edit syllabus

**Possible causes:**
1. Insufficient permissions
2. Syllabus is locked for editing

**Solution:**
- Verify you have admin role
- Check if syllabus is in editable status
- Contact system administrator

---

## Tips and Best Practices

### 1. Start with Subject-Wide

When implementing the system:
1. Create subject-wide syllabi first
2. Add class-wide syllabi for grade-specific content
3. Create section-specific syllabi only when needed

### 2. Use Academic Years

Always specify academic year for:
- Better organization
- Easier year-over-year comparison
- Automatic archiving at year end

### 3. Leverage Cloning

Save time by:
- Cloning previous year's syllabus
- Cloning class-wide to create section-specific
- Cloning general to create advanced/remedial versions

### 4. Maintain Version History

- Increment versions for significant changes
- Link new versions to parent
- Keep old versions as DEPRECATED (don't delete)

### 5. Use Descriptive Titles

Good titles include:
- Subject name
- Grade level (if class-wide)
- Section (if section-specific)
- Curriculum type (if not general)
- Academic year

**Examples:**
- "Mathematics - Grade 10 - Advanced"
- "Physics - Section A - CBSE 2024-25"
- "English Literature - Remedial"

### 6. Add Comprehensive Metadata

- Use tags liberally for searchability
- Set realistic estimated hours
- Document prerequisites clearly
- Choose appropriate difficulty level

### 7. Follow Status Workflow

- Keep drafts until ready for review
- Use PENDING_REVIEW for approval process
- Only publish when fully ready
- Archive old syllabi, don't delete

---

## Keyboard Shortcuts

Speed up your workflow with shortcuts:

- `Ctrl/Cmd + N`: Create new syllabus
- `Ctrl/Cmd + S`: Save current syllabus
- `Ctrl/Cmd + F`: Focus search/filter
- `Esc`: Close dialogs
- `Tab`: Navigate form fields

---

## Getting Help

### Support Resources

1. **Documentation**: Check this guide and API reference
2. **Admin Support**: Contact your system administrator
3. **Training**: Request training sessions for your team
4. **Feedback**: Submit feature requests and bug reports

### Contact Information

For technical support:
- Email: support@yourschool.edu
- Phone: (555) 123-4567
- Help Desk: Available Mon-Fri, 9 AM - 5 PM

---

## Appendix

### Glossary

- **Scope**: The organizational level at which a syllabus applies
- **Fallback Logic**: Automatic selection of most specific applicable syllabus
- **Curriculum Type**: Classification of curriculum difficulty/purpose
- **Board Type**: Educational board or examination system
- **Effective Date**: Date range when syllabus is active
- **Version**: Iteration number of syllabus
- **Status**: Lifecycle state of syllabus

### Related Documentation

- [API Reference](./ENHANCED_SYLLABUS_API_REFERENCE.md)
- [Migration Guide](./ENHANCED_SYLLABUS_MIGRATION_GUIDE.md)
- [Best Practices](./ENHANCED_SYLLABUS_BEST_PRACTICES.md)
- [Admin Guide](./ENHANCED_SYLLABUS_ADMIN_GUIDE.md)
