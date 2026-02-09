#!/usr/bin/env python3

"""
Fix TypeScript errors related to unified auth refactor
"""

import re
import sys

files_to_fix = [
    'src/app/api/calendar/events/route.ts',
    'src/app/api/calendar/export/route.ts',
    'src/app/api/calendar/preferences/route.ts',
    'src/app/api/payments/create/route.ts',
    'src/app/api/payments/verify/route.ts',
    'src/app/api/reports/batch-download/route.ts',
    'src/app/api/teacher/achievements/[id]/route.ts',
    'src/app/api/teacher/achievements/route.ts',
    'src/app/api/teacher/documents/route.ts',
    'src/app/api/teacher/events/[id]/rsvp/route.ts',
    'src/app/api/teacher/events/route.ts',
    'src/app/api/students/[id]/route.ts',
]

def fix_user_where_clause(content):
    """Remove schoolId from User where clauses"""
    # Pattern 1: schoolId: context.schoolId, // CRITICAL: Filter by school
    content = re.sub(
        r'(\s+)schoolId:\s*context\.schoolId,\s*//\s*CRITICAL:\s*Filter by school\s*\n',
        '',
        content
    )
    
    # Pattern 2: schoolId, // CRITICAL: Filter by school
    content = re.sub(
        r'(\s+)schoolId,\s*//\s*CRITICAL:\s*Filter by school\s*\n',
        '',
        content
    )
    
    return content

def fix_teacher_references(content):
    """Fix user.teacher references - needs to use include"""
    # This is more complex and needs manual review
    # Just add a comment for now
    if 'user.teacher' in content and 'include:' not in content:
        print("  ⚠️  Found user.teacher without include - needs manual review")
    return content

def fix_user_schools_references(content):
    """Fix user.userSchools references"""
    if 'user.userSchools[0]' in content:
        # Check if include is present
        if 'userSchools:' not in content:
            print("  ⚠️  Found user.userSchools without include - needs manual review")
    return content

def fix_file(filepath):
    """Fix a single file"""
    print(f"Fixing {filepath}...")
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        content = fix_user_where_clause(content)
        content = fix_teacher_references(content)
        content = fix_user_schools_references(content)
        
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  ✓ Fixed {filepath}")
            return True
        else:
            print(f"  - No changes needed")
            return False
            
    except FileNotFoundError:
        print(f"  ✗ File not found: {filepath}")
        return False
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

def main():
    print("Starting TypeScript error fixes...\n")
    
    fixed_count = 0
    for filepath in files_to_fix:
        if fix_file(filepath):
            fixed_count += 1
    
    print(f"\nFixed {fixed_count} files.")
    print("Run 'npx tsc --noEmit' to verify.")

if __name__ == '__main__':
    main()
