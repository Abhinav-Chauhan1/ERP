#!/bin/bash

# Script to audit database queries for missing schoolId filters
# This helps identify potential multi-tenancy data isolation issues

echo "=== School Isolation Audit ==="
echo "Checking for database queries without schoolId filtering..."
echo ""

# Find all action files
ACTION_FILES=$(find src/lib/actions -name "*.ts" -type f | grep -v ".test.ts")

# Track findings
TOTAL_FILES=0
SUSPICIOUS_FILES=0

# Output file for detailed report
REPORT_FILE="school-isolation-audit-report.txt"
echo "School Isolation Audit Report" > $REPORT_FILE
echo "Generated: $(date)" >> $REPORT_FILE
echo "======================================" >> $REPORT_FILE
echo "" >> $REPORT_FILE

for file in $ACTION_FILES; do
    TOTAL_FILES=$((TOTAL_FILES + 1))
    
    # Check if file has database queries
    if grep -q "db\.\|prisma\." "$file"; then
        # Check if it has schoolId filtering
        if ! grep -q "schoolId" "$file"; then
            SUSPICIOUS_FILES=$((SUSPICIOUS_FILES + 1))
            echo "⚠️  SUSPICIOUS: $file"
            echo "⚠️  SUSPICIOUS: $file" >> $REPORT_FILE
            
            # Show the database queries in this file
            echo "   Database queries found:" >> $REPORT_FILE
            grep -n "db\.\|findMany\|findUnique\|findFirst\|create\|update\|delete" "$file" | head -5 >> $REPORT_FILE
            echo "" >> $REPORT_FILE
        fi
    fi
done

echo ""
echo "=== Summary ==="
echo "Total action files checked: $TOTAL_FILES"
echo "Suspicious files (no schoolId): $SUSPICIOUS_FILES"
echo ""
echo "Detailed report saved to: $REPORT_FILE"
