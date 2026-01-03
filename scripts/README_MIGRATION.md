# Syllabus Migration Scripts

## Available Tools

### 1. Enhanced CLI (Recommended) ⭐
Interactive CLI with progress reporting, error logging, and recovery:
```bash
npm run migrate:cli
```

### 2. Basic Script
Direct migration script (legacy):
```bash
npm run migrate:syllabus
```

## Quick Start (Enhanced CLI)

### 1. Test Migration (Dry Run)
```bash
npm run migrate:cli -- --dry-run
```

### 2. Execute Migration Interactively
```bash
npm run migrate:cli
```

### 3. Verify Migration
```bash
npm run migrate:cli -- --verify
```

### 4. Rollback (if needed)
```bash
npm run migrate:cli -- --rollback
```

## Enhanced CLI Features

✅ **Interactive Mode** - User-friendly prompts and confirmations  
✅ **Progress Reporting** - Real-time progress bars and status  
✅ **Error Logging** - Comprehensive logs with timestamps  
✅ **Recovery** - Automatic backup and rollback capability  
✅ **Colored Output** - Easy-to-read terminal output  
✅ **Verification** - Built-in integrity checks  

### CLI Options

```bash
--dry-run          # Test without changes
--auto             # Skip confirmations
--verify           # Check integrity
--rollback         # Undo migration
--verbose          # Detailed output
--log=<file>       # Custom log file
--help             # Show help
```

### Examples

```bash
# Interactive migration (recommended)
npm run migrate:cli

# Automated migration
npm run migrate:cli -- --auto

# Verbose dry-run
npm run migrate:cli -- --dry-run --verbose

# Custom log file
npm run migrate:cli -- --log=my-migration.log
```

## What It Does

Converts the old syllabus structure to the new enhanced structure:

**Old Structure:**
- Syllabus → SyllabusUnit → Lesson

**New Structure:**
- Syllabus → Module → SubModule

## Features

✅ **Preserves all data and relationships**
- All titles, descriptions, and content preserved
- Parent-child relationships maintained
- Order preserved

✅ **Sequential chapter numbering**
- Automatically assigns chapter numbers (1, 2, 3, ...)
- Based on unit order

✅ **Safe migration**
- Dry-run mode for testing
- Old structure remains intact
- Automatic verification
- Rollback capability

✅ **Detailed reporting**
- Progress logs
- Statistics
- Error reporting

## Migration Details

### Unit → Module Conversion
- `title` → `title`
- `description` → `description`
- `order` → `order`
- Sequential `chapterNumber` assigned

### Lesson → SubModule Conversion
- `title` → `title`
- `description` → `description`
- Sequential `order` within module
- Linked to parent Module

## Requirements

- Requirements 7.1: Unit to Module conversion
- Requirements 7.2: Lesson to SubModule conversion
- Requirements 7.3: Relationship preservation
- Requirements 7.4: Sequential chapter number assignment

## Documentation

- **[Quick Reference](./MIGRATION_CLI_QUICK_REFERENCE.md)** - Essential commands and cheat sheet
- **[Complete Guide](./MIGRATION_CLI_GUIDE.md)** - Comprehensive documentation
- **[Design Document](./../.kiro/specs/enhanced-syllabus-system/design.md)** - System design
- **[Requirements](./../.kiro/specs/enhanced-syllabus-system/requirements.md)** - Feature requirements

## Testing

Test the CLI functionality:
```bash
npm run test:migrate-cli
```

## See Also

- [Detailed Migration Guide](./MIGRATION_GUIDE.md) - Complete documentation
- [Enhanced Syllabus Design](./../.kiro/specs/enhanced-syllabus-system/design.md) - System design
- [Requirements](./../.kiro/specs/enhanced-syllabus-system/requirements.md) - Feature requirements
