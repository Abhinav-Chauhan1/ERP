#!/bin/bash
# Master Security Audit Script
# Runs all security audit scripts and generates a consolidated report

set -e

echo "================================================"
echo "Comprehensive Security Audit Suite"
echo "================================================"
echo ""
echo "This will run all security audit scripts:"
echo "  1. School Isolation Scanner"
echo "  2. Security Pattern Scanner"
echo "  3. Dependency Audit"
echo ""
echo "Starting audit..."
echo ""

OUTPUT_DIR="security-audit-results"
mkdir -p "$OUTPUT_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MASTER_REPORT="$OUTPUT_DIR/master-audit-report-$TIMESTAMP.md"

# Initialize master report
echo "# Master Security Audit Report" > "$MASTER_REPORT"
echo "Generated: $(date)" >> "$MASTER_REPORT"
echo "" >> "$MASTER_REPORT"
echo "This report consolidates findings from all security audit scripts." >> "$MASTER_REPORT"
echo "" >> "$MASTER_REPORT"
echo "---" >> "$MASTER_REPORT"
echo "" >> "$MASTER_REPORT"

# Make scripts executable
chmod +x scripts/security-audit/*.sh

# 1. Run School Isolation Scanner
echo "================================================"
echo "1/3 Running School Isolation Scanner..."
echo "================================================"
if bash scripts/security-audit/scan-school-isolation.sh; then
    echo "✓ School Isolation Scanner completed"
    echo "## School Isolation Audit" >> "$MASTER_REPORT"
    echo "" >> "$MASTER_REPORT"
    echo "See detailed report: \`school-isolation-report-*.md\`" >> "$MASTER_REPORT"
    echo "" >> "$MASTER_REPORT"
else
    echo "✗ School Isolation Scanner failed"
    echo "## School Isolation Audit" >> "$MASTER_REPORT"
    echo "" >> "$MASTER_REPORT"
    echo "**Status:** FAILED" >> "$MASTER_REPORT"
    echo "" >> "$MASTER_REPORT"
fi
echo ""

# 2. Run Security Pattern Scanner
echo "================================================"
echo "2/3 Running Security Pattern Scanner..."
echo "================================================"
if bash scripts/security-audit/scan-security-patterns.sh; then
    echo "✓ Security Pattern Scanner completed"
    echo "## Security Pattern Audit" >> "$MASTER_REPORT"
    echo "" >> "$MASTER_REPORT"
    echo "See detailed report: \`security-patterns-report-*.md\`" >> "$MASTER_REPORT"
    echo "" >> "$MASTER_REPORT"
else
    echo "✗ Security Pattern Scanner failed"
    echo "## Security Pattern Audit" >> "$MASTER_REPORT"
    echo "" >> "$MASTER_REPORT"
    echo "**Status:** FAILED" >> "$MASTER_REPORT"
    echo "" >> "$MASTER_REPORT"
fi
echo ""

# 3. Run Dependency Audit
echo "================================================"
echo "3/3 Running Dependency Audit..."
echo "================================================"
if bash scripts/security-audit/audit-dependencies.sh; then
    echo "✓ Dependency Audit completed"
    echo "## Dependency Audit" >> "$MASTER_REPORT"
    echo "" >> "$MASTER_REPORT"
    echo "See detailed report: \`dependency-audit-report-*.md\`" >> "$MASTER_REPORT"
    echo "" >> "$MASTER_REPORT"
else
    echo "✗ Dependency Audit failed"
    echo "## Dependency Audit" >> "$MASTER_REPORT"
    echo "" >> "$MASTER_REPORT"
    echo "**Status:** FAILED" >> "$MASTER_REPORT"
    echo "" >> "$MASTER_REPORT"
fi
echo ""

# 4. Run TypeScript Check
echo "================================================"
echo "Running TypeScript Compilation Check..."
echo "================================================"
echo "## TypeScript Compilation" >> "$MASTER_REPORT"
echo "" >> "$MASTER_REPORT"
echo "\`\`\`" >> "$MASTER_REPORT"

if npx tsc --noEmit >> "$MASTER_REPORT" 2>&1; then
    echo "✓ TypeScript compilation successful"
    echo "**Status:** PASSED ✓" >> "$MASTER_REPORT"
else
    echo "✗ TypeScript compilation failed"
    echo "**Status:** FAILED ✗" >> "$MASTER_REPORT"
fi

echo "\`\`\`" >> "$MASTER_REPORT"
echo "" >> "$MASTER_REPORT"
echo ""

# 5. Run ESLint Check
echo "================================================"
echo "Running ESLint Check..."
echo "================================================"
echo "## ESLint Analysis" >> "$MASTER_REPORT"
echo "" >> "$MASTER_REPORT"
echo "\`\`\`" >> "$MASTER_REPORT"

if npx eslint . --ext .ts,.tsx --max-warnings 0 >> "$MASTER_REPORT" 2>&1; then
    echo "✓ ESLint check passed"
    echo "**Status:** PASSED ✓" >> "$MASTER_REPORT"
else
    echo "✗ ESLint check failed"
    echo "**Status:** FAILED ✗" >> "$MASTER_REPORT"
fi

echo "\`\`\`" >> "$MASTER_REPORT"
echo "" >> "$MASTER_REPORT"
echo ""

# Generate Summary
echo "---" >> "$MASTER_REPORT"
echo "" >> "$MASTER_REPORT"
echo "## Summary" >> "$MASTER_REPORT"
echo "" >> "$MASTER_REPORT"
echo "Audit completed at: $(date)" >> "$MASTER_REPORT"
echo "" >> "$MASTER_REPORT"
echo "### Reports Generated" >> "$MASTER_REPORT"
echo "" >> "$MASTER_REPORT"
echo "All detailed reports are available in the \`$OUTPUT_DIR\` directory:" >> "$MASTER_REPORT"
echo "" >> "$MASTER_REPORT"
echo "- School Isolation Report" >> "$MASTER_REPORT"
echo "- Security Patterns Report" >> "$MASTER_REPORT"
echo "- Dependency Audit Report" >> "$MASTER_REPORT"
echo "- TypeScript Compilation Results" >> "$MASTER_REPORT"
echo "- ESLint Analysis Results" >> "$MASTER_REPORT"
echo "" >> "$MASTER_REPORT"

# Count total issues
TOTAL_REPORTS=$(ls -1 "$OUTPUT_DIR"/*-report-*.md 2>/dev/null | wc -l || echo "0")

echo "### Next Steps" >> "$MASTER_REPORT"
echo "" >> "$MASTER_REPORT"
echo "1. Review all generated reports in detail" >> "$MASTER_REPORT"
echo "2. Prioritize issues by severity (CRITICAL > HIGH > MEDIUM > LOW)" >> "$MASTER_REPORT"
echo "3. Create tickets for remediation" >> "$MASTER_REPORT"
echo "4. Fix critical and high-severity issues immediately" >> "$MASTER_REPORT"
echo "5. Schedule regular security audits (weekly/monthly)" >> "$MASTER_REPORT"
echo "" >> "$MASTER_REPORT"

echo "================================================"
echo "All audits complete!"
echo "================================================"
echo ""
echo "Master report: $MASTER_REPORT"
echo "Total reports generated: $TOTAL_REPORTS"
echo ""
echo "Review the master report for a summary of all findings."
echo "================================================"

# Open master report if on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "$MASTER_REPORT"
fi
