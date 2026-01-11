# Historical Alumni Import - Quick Reference

## Quick Start

```bash
# 1. Preview what will be imported
npm run import:alumni -- --dry-run

# 2. Run the import
npm run import:alumni

# 3. Validate results
npm run import:alumni -- --validate
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run import:alumni -- --dry-run` | Preview changes without modifying database |
| `npm run import:alumni` | Run the actual import |
| `npm run import:alumni -- --validate` | Verify all graduated students have alumni profiles |
| `npm run import:alumni -- --help` | Show help information |

## What It Does

1. Finds all students with `GRADUATED` enrollment status
2. Checks if they already have alumni profiles
3. Creates alumni profiles for students without them
4. Backfills graduation dates from enrollment records
5. Generates a detailed report

## Alumni Profile Fields

### Automatically Populated
- Student ID (link to student record)
- Graduation date
- Final class and section
- Final academic year
- Created by (set to "system")
- Communication preferences (default: enabled)

### Left Empty (for later updates)
- Current occupation and employer
- Current address and contact info
- Higher education details
- Achievements and awards
- LinkedIn profile
- Updated profile photo

## Safety Features

- **Dry Run Mode**: Preview before making changes
- **Duplicate Prevention**: Skips students who already have alumni profiles
- **Batch Processing**: Processes 50 students at a time
- **Error Handling**: Continues even if individual imports fail
- **5-Second Countdown**: Time to cancel before actual import
- **Detailed Logging**: All operations logged to file

## Output

### Console
Shows progress and summary:
- Total graduated students found
- Already have alumni profiles
- Newly imported
- Failed imports (if any)

### Log File
Saved to `logs/alumni-import-[timestamp].log`:
- Complete import report
- List of all imported alumni
- Error details (if any)

## Testing

```bash
# Create test data
npx tsx scripts/test-alumni-import.ts

# Verify import results
npx tsx scripts/test-alumni-import.ts verify

# Clean up test data
npx tsx scripts/test-alumni-import.ts cleanup
```

## Troubleshooting

### No graduated students found
- Verify students have `GRADUATED` enrollment status
- Check database connection

### Alumni profile already exists
- Script automatically skips these
- Run validation to verify

### Import fails
- Check error messages in console and log file
- Verify database schema matches Prisma schema
- Ensure sufficient database permissions

## Best Practices

1. **Always run dry-run first** to preview changes
2. **Backup database** before running on production
3. **Run during off-peak hours** to minimize impact
4. **Validate after import** to ensure completeness
5. **Review log file** for any warnings or errors

## Requirements

Addresses requirements:
- **4.1**: Automatic alumni profile creation
- **4.2**: Copying student information to alumni records

## Related Documentation

- [Full Guide](./ALUMNI_IMPORT_GUIDE.md)
- [Requirements](../.kiro/specs/student-promotion-alumni/requirements.md)
- [Design](../.kiro/specs/student-promotion-alumni/design.md)
