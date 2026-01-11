# Historical Alumni Import Guide

## Overview

The Historical Alumni Import Script identifies existing graduated students in the database and automatically creates alumni profiles for them. This is useful for backfilling alumni data when implementing the alumni management system on an existing school database.

## Features

- **Automatic Detection**: Finds all students with `GRADUATED` enrollment status
- **Dry Run Mode**: Preview changes before applying them
- **Validation Mode**: Verify import results
- **Batch Processing**: Processes students in batches to avoid database overload
- **Error Handling**: Continues processing even if individual imports fail
- **Detailed Reporting**: Generates comprehensive reports saved to logs directory
- **Safe Execution**: 5-second countdown before actual import

## Requirements

This script addresses requirements:
- **4.1**: Automatic alumni profile creation when students graduate
- **4.2**: Copying relevant student information to alumni records

## Usage

### 1. Preview Changes (Dry Run)

Before running the actual import, preview what will be imported:

```bash
npm run import:alumni -- --dry-run
```

This will:
- Find all graduated students
- Show which students already have alumni profiles
- Show which students need alumni profiles
- Display sample data for the first 10 students
- **Make no changes to the database**

### 2. Run the Import

After reviewing the dry run, execute the actual import:

```bash
npm run import:alumni
```

This will:
- Wait 5 seconds (allowing you to cancel with Ctrl+C)
- Create alumni profiles for all graduated students without profiles
- Process students in batches of 50
- Show progress during import
- Generate a detailed report
- Save the report to `logs/alumni-import-[timestamp].log`

### 3. Validate Results

After import, verify that all graduated students have alumni profiles:

```bash
npm run import:alumni -- --validate
```

This will:
- Check all graduated students
- Report how many have alumni profiles
- List any students missing alumni profiles
- Exit with code 0 if validation passes, 1 if it fails

### 4. Show Help

Display usage information:

```bash
npm run import:alumni -- --help
```

## What Gets Imported

For each graduated student without an alumni profile, the script creates an `Alumni` record with:

### Automatically Populated Fields

- **studentId**: Link to the original student record
- **graduationDate**: Date when enrollment status changed to GRADUATED
- **finalClass**: The class from which the student graduated (e.g., "Grade 12")
- **finalSection**: The section from which the student graduated (e.g., "A")
- **finalAcademicYear**: The academic year of graduation (e.g., "2023-2024")
- **createdBy**: Set to "system" for automated imports
- **updatedBy**: Set to "system" for automated imports
- **allowCommunication**: Set to `true` by default

### Fields Left Empty (To Be Filled Later)

These fields can be updated later by administrators or alumni themselves:

- Current occupation and employer
- Current address and contact information
- Higher education details
- Achievements and awards
- LinkedIn profile
- Updated profile photo
- Communication preferences

## How It Works

### 1. Student Detection

The script finds graduated students by:

1. Querying all `ClassEnrollment` records with status `GRADUATED`
2. Grouping by student ID (in case a student has multiple graduated enrollments)
3. Using the most recent graduation for each student
4. Checking if an alumni profile already exists

### 2. Graduation Date Determination

The graduation date is determined from the `updatedAt` timestamp of the enrollment record. This represents when the enrollment status was changed to `GRADUATED`.

### 3. Batch Processing

Students are processed in batches of 50 to:
- Avoid overwhelming the database
- Provide better progress feedback
- Allow partial success if some imports fail

### 4. Transaction Safety

Each batch is processed in a database transaction, ensuring:
- All-or-nothing processing per batch
- Data consistency
- Rollback on critical errors

## Output and Reporting

### Console Output

During import, you'll see:
```
================================================================================
STARTING HISTORICAL ALUMNI IMPORT
================================================================================

Found 150 students needing alumni profiles

Processing batch 1 (50 students)...
  Imported 10/150 alumni profiles...
  Imported 20/150 alumni profiles...
  ...
Processing batch 2 (50 students)...
  ...

================================================================================
IMPORT COMPLETE
================================================================================

Summary:
  Total graduated students: 200
  Already had alumni profiles: 50
  Newly imported: 150
  Failed: 0

✅ Import completed successfully
```

### Log File

A detailed report is saved to `logs/alumni-import-[timestamp].log` containing:

- Import timestamp
- Summary statistics
- Complete list of imported alumni with details
- Any errors encountered

## Error Handling

### Individual Student Failures

If a single student import fails:
- The error is logged
- The script continues with remaining students
- The failed student is listed in the final report

### Batch Failures

If an entire batch fails:
- The transaction is rolled back for that batch
- The script continues with the next batch
- All failures are reported at the end

### Fatal Errors

If a critical error occurs:
- The script exits immediately
- The error is displayed
- Exit code 1 is returned

## Validation

### Pre-Import Validation

Before importing, the script validates:
- Database connection
- Prisma schema compatibility
- Required models exist

### Post-Import Validation

After importing, run validation to ensure:
- All graduated students have alumni profiles
- No data inconsistencies
- Proper relationships established

## Best Practices

### 1. Always Run Dry Run First

```bash
npm run import:alumni -- --dry-run
```

Review the output to understand what will be imported.

### 2. Backup Your Database

Before running the import on production:

```bash
# Create a database backup
pg_dump your_database > backup_before_alumni_import.sql
```

### 3. Run During Low Traffic

Schedule the import during off-peak hours to minimize impact on system performance.

### 4. Validate After Import

```bash
npm run import:alumni -- --validate
```

Ensure all graduated students have alumni profiles.

### 5. Review the Log File

Check the generated log file for any warnings or errors.

## Troubleshooting

### No Graduated Students Found

**Problem**: Script reports "No graduated students found"

**Solutions**:
- Verify that students have been marked as graduated
- Check that enrollment status is set to `GRADUATED`
- Ensure the database connection is working

### Alumni Profile Already Exists Error

**Problem**: Error about duplicate alumni profile

**Solutions**:
- This shouldn't happen as the script checks for existing profiles
- If it does, run validation to identify the issue
- Manually check the database for duplicate entries

### Database Connection Timeout

**Problem**: Script times out during import

**Solutions**:
- Reduce batch size in the script (change `BATCH_SIZE` constant)
- Check database connection settings
- Ensure database has sufficient resources

### Partial Import

**Problem**: Some students imported, others failed

**Solutions**:
- Review the error messages in the console and log file
- Fix the underlying issues (e.g., data validation errors)
- Re-run the import (it will skip already imported students)

## Technical Details

### Database Schema

The script creates records in the `Alumni` table with the following structure:

```prisma
model Alumni {
  id                String   @id @default(cuid())
  studentId         String   @unique
  graduationDate    DateTime
  finalClass        String
  finalSection      String
  finalAcademicYear String
  createdBy         String
  updatedBy         String?
  allowCommunication Boolean @default(true)
  // ... other optional fields
}
```

### Dependencies

- `@prisma/client`: Database ORM
- `fs`: File system operations
- `path`: Path manipulation

### Performance

- **Batch Size**: 50 students per batch
- **Transaction Scope**: Per batch
- **Memory Usage**: Minimal (streaming approach)
- **Typical Speed**: ~100 students per minute

## Examples

### Example 1: First-Time Import

```bash
# Step 1: Preview
npm run import:alumni -- --dry-run

# Output shows 150 students need profiles

# Step 2: Import
npm run import:alumni

# Wait 5 seconds, then import runs

# Step 3: Validate
npm run import:alumni -- --validate

# Output: ✅ Validation PASSED
```

### Example 2: Incremental Import

```bash
# Run import again after more students graduate
npm run import:alumni

# Output shows:
#   Already had alumni profiles: 150
#   Newly imported: 25
```

### Example 3: Validation Failure

```bash
npm run import:alumni -- --validate

# Output:
# ❌ Validation FAILED - Some graduated students are missing alumni profiles:
#   - John Doe (ADM001)
#   - Jane Smith (ADM002)
#   ... and 3 more

# Fix: Run import again
npm run import:alumni
```

## Integration with Alumni Management System

After running this import:

1. **Alumni Directory**: All historical graduates will appear in the alumni directory
2. **Search and Filter**: Administrators can search and filter alumni
3. **Profile Updates**: Administrators can update alumni information
4. **Communication**: Alumni can be included in communications
5. **Reports**: Alumni statistics will include historical data

## Support

For issues or questions:

1. Check the log file in `logs/alumni-import-[timestamp].log`
2. Review this guide's troubleshooting section
3. Verify database schema matches Prisma schema
4. Check that all required models exist

## Related Documentation

- [Student Promotion and Alumni Management Requirements](../.kiro/specs/student-promotion-alumni/requirements.md)
- [Student Promotion and Alumni Management Design](../.kiro/specs/student-promotion-alumni/design.md)
- [Implementation Tasks](../.kiro/specs/student-promotion-alumni/tasks.md)
