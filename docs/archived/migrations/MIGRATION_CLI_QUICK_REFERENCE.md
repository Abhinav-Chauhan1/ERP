# Migration CLI Quick Reference

## Essential Commands

```bash
# 1. Test migration (always run first!)
npm run migrate:cli -- --dry-run

# 2. Run migration interactively
npm run migrate:cli

# 3. Verify migration
npm run migrate:cli -- --verify

# 4. Rollback if needed
npm run migrate:cli -- --rollback
```

## All Options

| Option | Description | Example |
|--------|-------------|---------|
| `--dry-run` | Test without changes | `npm run migrate:cli -- --dry-run` |
| `--auto` | Skip confirmations | `npm run migrate:cli -- --auto` |
| `--verify` | Check integrity | `npm run migrate:cli -- --verify` |
| `--rollback` | Undo migration | `npm run migrate:cli -- --rollback` |
| `--verbose` | Detailed output | `npm run migrate:cli -- --verbose` |
| `--log=<file>` | Custom log file | `npm run migrate:cli -- --log=my.log` |
| `--help` | Show help | `npm run migrate:cli -- --help` |

## Migration Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Backup Database (manually)                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Test with Dry-Run                                        │
│    npm run migrate:cli -- --dry-run                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Review Output & Statistics                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Run Actual Migration                                     │
│    npm run migrate:cli                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Verify Integrity                                         │
│    npm run migrate:cli -- --verify                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Test Application                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    ┌───────┴───────┐
                    │               │
              ✓ Success        ✗ Issues
                    │               │
                    │               ↓
                    │    ┌─────────────────────┐
                    │    │ Rollback & Fix      │
                    │    │ npm run migrate:cli │
                    │    │ -- --rollback       │
                    │    └─────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Update Application Code                                  │
└─────────────────────────────────────────────────────────────┘
```

## What Gets Migrated

```
SyllabusUnit → Module
  - title ✓
  - description ✓
  - order ✓
  - chapterNumber (new, sequential: 1, 2, 3...)

Lesson → SubModule
  - title ✓
  - description ✓
  - order ✓ (sequential: 1, 2, 3...)
```

## Output Colors

- 🔵 **Blue** - Information
- 🟢 **Green** - Success
- 🟡 **Yellow** - Warning
- 🔴 **Red** - Error
- ⚪ **Dim** - Debug info

## Log Files Location

```
logs/
  ├── migration-<timestamp>.log          # Detailed log
  └── migration-backup-<syllabus-id>.json  # Rollback data
```

## Common Issues

| Issue | Solution |
|-------|----------|
| No syllabi found | Ensure database has syllabi with units |
| Chapter numbers not sequential | Rollback and re-run |
| Unit count mismatch | Check logs, rollback, fix, re-run |
| Backup not found | Manual rollback needed |

## Safety Checklist

- [ ] Database backed up
- [ ] Dry-run completed successfully
- [ ] Output reviewed and looks correct
- [ ] Tested on staging first
- [ ] Ready to proceed

## Emergency Rollback

```bash
# If migration fails or has issues
npm run migrate:cli -- --rollback

# If backup files are missing, manual rollback:
# DELETE FROM "SubModule";
# DELETE FROM "Module";
```

## Verification Checks

✓ Module count = Unit count  
✓ Chapter numbers sequential (1, 2, 3...)  
✓ SubModule count = Lesson count  
✓ All relationships valid  
✓ No orphaned records  

## Performance

| Database Size | Expected Time |
|---------------|---------------|
| < 10 syllabi | < 5 seconds |
| 10-50 syllabi | 5-30 seconds |
| > 50 syllabi | 30+ seconds |

## Support

1. Check log file: `logs/migration-<timestamp>.log`
2. Run verification: `npm run migrate:cli -- --verify`
3. Review guide: `scripts/MIGRATION_CLI_GUIDE.md`
4. Check design doc: `.kiro/specs/enhanced-syllabus-system/design.md`

## Version

CLI Version: 1.0.0  
Last Updated: 2024-12-25
