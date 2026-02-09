#!/bin/bash
# School Isolation Security Scanner
# Scans for database queries missing school isolation

set -e

echo "================================================"
echo "School Isolation Security Scanner"
echo "================================================"
echo ""

OUTPUT_DIR="security-audit-results"
mkdir -p "$OUTPUT_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$OUTPUT_DIR/school-isolation-report-$TIMESTAMP.md"

echo "# School Isolation Audit Report" > "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Function to scan files
scan_pattern() {
    local pattern=$1
    local description=$2
    local file_pattern=$3
    
    echo "Scanning: $description..."
    echo "## $description" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    if command -v rg &> /dev/null; then
        # Use ripgrep if available
        rg "$pattern" "$file_pattern" -A 5 -B 2 --no-heading --line-number >> "$REPORT_FILE" 2>/dev/null || echo "No issues found" >> "$REPORT_FILE"
    else
        # Fallback to grep
        grep -r -n -A 5 -B 2 "$pattern" "$file_pattern" >> "$REPORT_FILE" 2>/dev/null || echo "No issues found" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
    echo "---" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
}

# 1. Find findMany without schoolId
echo "1. Scanning for findMany queries without schoolId..."
scan_pattern "db\.\w+\.findMany\(\{" "FindMany Queries Without SchoolId" "src/"

# 2. Find findFirst without schoolId
echo "2. Scanning for findFirst queries without schoolId..."
scan_pattern "db\.\w+\.findFirst\(\{" "FindFirst Queries Without SchoolId" "src/"

# 3. Find update/delete operations
echo "3. Scanning for update/delete operations..."
scan_pattern "db\.\w+\.(update|delete|updateMany|deleteMany)\(\{" "Update/Delete Operations" "src/"

# 4. Find count operations
echo "4. Scanning for count operations..."
scan_pattern "db\.\w+\.count\(\{" "Count Operations" "src/"

# 5. Find aggregate operations
echo "5. Scanning for aggregate operations..."
scan_pattern "db\.\w+\.aggregate\(\{" "Aggregate Operations" "src/"

# 6. Scan API routes specifically
echo "6. Scanning API routes..."
scan_pattern "export.*async.*function.*(GET|POST|PUT|DELETE)" "API Route Handlers" "src/app/api/"

# 7. Scan server actions
echo "7. Scanning server actions..."
scan_pattern "export.*async.*function" "Server Actions" "src/lib/actions/"

# 8. Scan page components
echo "8. Scanning page components..."
scan_pattern "db\.\w+\." "Database Queries in Pages" "src/app/**/page.tsx"

echo "" >> "$REPORT_FILE"
echo "## Summary" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Scan completed at: $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Count issues
ISSUE_COUNT=$(grep -c "db\." "$REPORT_FILE" || echo "0")
echo "Total database queries found: $ISSUE_COUNT" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "================================================"
echo "Scan complete!"
echo "Report saved to: $REPORT_FILE"
echo "Total queries found: $ISSUE_COUNT"
echo "================================================"

# Open report if on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "$REPORT_FILE"
fi
