# Syllabus Migration CLI Guide

## Overview

The Enhanced Syllabus Migration CLI is a comprehensive tool for migrating your syllabus structure from the old Units/Lessons format to the new Modules/SubModules format. It provides interactive prompts, detailed progress reporting, error logging, and recovery mechanisms.

## Features

- ✅ **Interactive Mode**: User-friendly prompts and confirmations
- ✅ **Dry-Run Mode**: Test migration without making any changes
- ✅ **Progress Reporting**: Real-time progress bars and status updates
- ✅ **Error Logging**: Comprehensive error logging to file with timestamps
- ✅ **Recovery Mechanisms**: Automatic backup and rollback capability
- ✅ **Verification**: Built-in integrity checks and validation
- ✅ **Colored Output**: Easy-to-read terminal output with color coding

## Quick Start

### 1. Test Migration (Recommended First Step)

Always start with a dry-run to see what will happen without making changes:

```bash
npm run migrate:cli -- --dry-run
```

This will:
- Show you what will be migrated
- Display statistics without making changes
- Help you identify potential issues

### 2. Run Migration Interactively

Run the migration with interactive prompts:

```bash
npm run migrate:cli
```

You'll be asked to confirm before proceeding. This is the safest way to run the migration.

### 3. Run Migration Automatically

For automated scripts or CI/CD pipelines:

```bash
npm run migrate:cli -- --auto
```

This skips all confirmation prompts.

## Command Reference

### Basic Commands

```bash
# Interactive migration (recommended)
npm run migrate:cli

# Dry-run (test without changes)
npm run migrate:cli -- --dry-run

# Non-interactive mode
npm run migrate:cli -- --auto

# Verify migration integrity
npm run migrate:cli -- --verify

# Rollback migration
npm run migrate:cli -- --rollback

# Show help
npm run migrate:cli -- --help
```

### Advanced Options

```bash
# Verbose output (detailed logging)
npm run migrate:cli -- --verbose

# Custom log file
npm run migrate:cli -- --log=my-migration.log

# Combine options
npm run migrate:cli -- --dry-run --verbose
```

## Migration Process

### What Gets Migrated?

The migration converts:

```
Old Structure              →    New Structure
─────────────────────────────────────────────────
Syllabus                   →    Syllabus (unchanged)
  └── SyllabusUnit         →      └── Module
        └── Lesson         →            └── SubModule
```

### Data Preservation

- ✅ All titles and descriptions are preserved
- ✅ Order and hierarchy are maintained
- ✅ Sequential chapter numbers are assigned (1, 2, 3, ...)
- ✅ Original Units/Lessons remain intact (not deleted)
- ✅ All relationships are preserved

### Migration Steps

1. **Fetch Data**: Retrieves all syllabi with units and lessons
2. **Convert Units**: Creates Module for each Unit with chapter number
3. **Convert Lessons**: Creates SubModule for each Lesson
4. **Backup**: Saves backup file for rollback capability
5. **Verify**: Checks integrity of migrated data
6. **Report**: Displays comprehensive summary

## Output and Logging

### Console Output

The CLI provides color-coded output:

- 🔵 **Blue**: Informational messages
- 🟢 **Green**: Success messages
- 🟡 **Yellow**: Warnings
- 🔴 **Red**: Errors
- ⚪ **Dim**: Debug/verbose information

### Log Files

All operations are logged to files in the `logs/` directory:

```
logs/
  ├── migration-2024-12-25T10-30-00-000Z.log
  ├── migration-backup-syllabus-id-1.json
  └── migration-backup-syllabus-id-2.json
```

**Log file contents:**
- Timestamps for all operations
- Detailed error messages with context
- Database operations
- Backup information

**Backup file contents:**
- Syllabus ID and title
- All created Module IDs
- All created SubModule IDs
- Timestamp of migration

## Error Handling

### Error Types

The CLI categorizes errors for better troubleshooting:

1. **Unit Errors**: Failed to convert a Unit to Module
2. **Lesson Errors**: Failed to convert a Lesson to SubModule
3. **Database Errors**: Database connection or constraint issues
4. **Unknown Errors**: Unexpected errors

### Error Recovery

**Recoverable Errors:**
- Individual lesson conversion failures
- The migration continues with other items

**Non-Recoverable Errors:**
- Database connection failures
- Unit conversion failures
- The migration stops and can be rolled back

### What to Do When Errors Occur

1. **Check the log file** for detailed error information
2. **Review the error context** to understand what failed
3. **Fix the underlying issue** (e.g., database constraints)
4. **Run verification** to check current state
5. **Rollback if needed** and try again

## Rollback

### When to Rollback

- Migration completed with critical errors
- Data integrity issues detected
- Need to re-run migration with fixes

### How to Rollback

```bash
npm run migrate:cli -- --rollback
```

This will:
- Load backup files from `logs/` directory
- Delete all created Modules and SubModules
- Preserve original Units and Lessons
- Clean up backup files

**Important Notes:**
- Rollback uses backup files from `logs/` directory
- Backup files are created during migration
- Keep backup files until you're sure migration is successful
- Rollback does NOT restore if you manually deleted backups

## Verification

### Running Verification

```bash
npm run migrate:cli -- --verify
```

### What Gets Verified

1. **Module Count**: Checks if Units were converted to Modules
2. **Chapter Numbers**: Verifies sequential numbering (1, 2, 3, ...)
3. **SubModule Count**: Ensures all Lessons were converted
4. **Relationships**: Validates parent-child relationships
5. **Data Integrity**: Checks for orphaned records

### Verification Results

**Pass**: All checks successful
- Module count matches Unit count
- Chapter numbers are sequential
- All relationships are valid

**Fail**: Issues detected
- Missing modules for existing units
- Non-sequential chapter numbers
- Orphaned sub-modules

## Best Practices

### Before Migration

1. ✅ **Backup your database** (always!)
2. ✅ **Run dry-run first** to preview changes
3. ✅ **Review the output** and statistics
4. ✅ **Check for errors** in dry-run mode
5. ✅ **Test on staging** environment first

### During Migration

1. ✅ **Monitor the progress** in real-time
2. ✅ **Watch for errors** in the output
3. ✅ **Don't interrupt** the migration process
4. ✅ **Keep the log file** for reference

### After Migration

1. ✅ **Run verification** to check integrity
2. ✅ **Review the log file** for any issues
3. ✅ **Test the new structure** in your application
4. ✅ **Keep backup files** until confirmed working
5. ✅ **Update your application** to use new structure

## Troubleshooting

### Common Issues

#### Issue: "No syllabi found to migrate"

**Cause**: No syllabi exist in the database
**Solution**: Ensure you have syllabi with units and lessons

#### Issue: "Chapter numbers are not sequential"

**Cause**: Previous partial migration or manual changes
**Solution**: Rollback and re-run migration

#### Issue: "Unit count doesn't match module count"

**Cause**: Partial migration or errors during conversion
**Solution**: Check log file, rollback, fix issues, and re-run

#### Issue: "Migration backups not found"

**Cause**: Backup files were deleted or migration ran in different session
**Solution**: Manual rollback by deleting Module/SubModule records

### Getting Help

1. **Check the log file** in `logs/` directory
2. **Run verification** to see current state
3. **Review error messages** with context
4. **Check database constraints** and relationships
5. **Consult the design document** for expected structure

## Examples

### Example 1: First-Time Migration

```bash
# Step 1: Test with dry-run
npm run migrate:cli -- --dry-run

# Step 2: Review output and verify it looks correct

# Step 3: Run actual migration
npm run migrate:cli

# Step 4: Verify integrity
npm run migrate:cli -- --verify

# Step 5: Test your application with new structure
```

### Example 2: Migration with Issues

```bash
# Run migration
npm run migrate:cli

# Errors occurred, check log
cat logs/migration-2024-12-25T10-30-00-000Z.log

# Rollback to clean state
npm run migrate:cli -- --rollback

# Fix the issues (e.g., database constraints)

# Try again
npm run migrate:cli
```

### Example 3: Automated Migration

```bash
# For CI/CD or scripts
npm run migrate:cli -- --auto --verbose --log=ci-migration.log

# Check exit code
if [ $? -eq 0 ]; then
  echo "Migration successful"
else
  echo "Migration failed"
  exit 1
fi
```

## Migration Statistics

After migration, you'll see a summary like:

```
═══════════════════════════════════════════════════════════════════
                        Migration Summary
═══════════════════════════════════════════════════════════════════

Statistics:
  Syllabi processed:     5
  Units converted:       25
  Lessons converted:     150
  Modules created:       25
  SubModules created:    150
  Errors:                0
  Warnings:              0
  Duration:              2.45s
```

## Safety Features

### Built-in Safety

1. **Confirmation Prompts**: Asks before making changes (interactive mode)
2. **Dry-Run Mode**: Test without any database changes
3. **Automatic Backups**: Creates backup files for rollback
4. **Transaction Support**: Uses database transactions where possible
5. **Error Isolation**: Continues migration even if individual items fail
6. **Verification**: Automatic integrity checks after migration

### Data Safety

- Original Units/Lessons are **never deleted**
- Migration creates **new records** (Modules/SubModules)
- Backup files enable **complete rollback**
- Log files provide **audit trail**
- Verification ensures **data integrity**

## Performance

### Expected Performance

- **Small databases** (< 10 syllabi): < 5 seconds
- **Medium databases** (10-50 syllabi): 5-30 seconds
- **Large databases** (> 50 syllabi): 30+ seconds

### Optimization Tips

1. Run during **off-peak hours**
2. Ensure good **database connection**
3. Use **--auto** mode for faster execution
4. Disable **--verbose** for better performance

## Next Steps

After successful migration:

1. **Update your application** to use Module/SubModule models
2. **Test all features** that use syllabus data
3. **Update UI components** to display new structure
4. **Gradually deprecate** old Unit/Lesson structure
5. **Monitor for issues** in production
6. **Keep backups** for at least 30 days

## Support

For issues or questions:

1. Check the **log files** for detailed information
2. Review the **design document** for expected behavior
3. Run **verification** to check current state
4. Consult the **requirements document** for specifications

## Version History

- **v1.0.0** (2024-12-25): Initial release
  - Interactive mode
  - Dry-run support
  - Progress reporting
  - Error logging
  - Rollback capability
  - Verification
