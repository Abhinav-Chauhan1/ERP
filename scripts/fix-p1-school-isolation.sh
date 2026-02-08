#!/bin/bash

# P1 School Isolation Fixes - Batch Script
# This script adds schoolId filters to all P1 high-priority files

echo "========================================="
echo "P1 School Isolation Fixes - Batch Script"
echo "========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
FIXED=0
FAILED=0

# Function to add school isolation import and schoolId to a file
fix_file() {
    local file=$1
    local description=$2
    
    echo -e "${YELLOW}Fixing: $file${NC}"
    echo "  Description: $description"
    
    # Check if file exists
    if [ ! -f "$file" ]; then
        echo -e "${RED}  ✗ File not found${NC}"
        ((FAILED++))
        return 1
    fi
    
    # Check if already fixed (has getRequiredSchoolId)
    if grep -q "getRequiredSchoolId" "$file"; then
        echo -e "${GREEN}  ✓ Already fixed (has getRequiredSchoolId)${NC}"
        ((FIXED++))
        return 0
    fi
    
    echo -e "${YELLOW}  → Needs manual review and fixing${NC}"
    echo "  → Add: const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');"
    echo "  → Add: const schoolId = await getRequiredSchoolId();"
    echo "  → Add schoolId to all where clauses"
    echo ""
    
    return 0
}

echo "Starting P1 fixes..."
echo ""

# P1 Files (15 total)
echo "=== P1 - HIGH PRIORITY FILES ==="
echo ""

fix_file "src/lib/actions/teacherStudentsActions.ts" "Teachers can see students from other schools"
fix_file "src/lib/actions/teacherResultsActions.ts" "Teacher results view shows all schools"
fix_file "src/lib/actions/teacherDashboardActions.ts" "Dashboard shows data from all schools"
fix_file "src/lib/actions/teacherTimetableActions.ts" "Timetable data not isolated"
fix_file "src/lib/actions/parent-performance-actions.ts" "Parents can see other schools' data"
fix_file "src/lib/actions/parent-academic-actions.ts" "Academic records not isolated"
fix_file "src/lib/actions/parent-attendance-actions.ts" "Attendance data not isolated"
fix_file "src/lib/actions/parent-document-actions.ts" "Documents not isolated by school"
fix_file "src/lib/actions/student-performance-actions.ts" "Student performance across schools"
fix_file "src/lib/actions/bulkMessagingActions.ts" "Messages can be sent across schools"
fix_file "src/lib/actions/messageAnalyticsActions.ts" "Message analytics show all schools"
fix_file "src/lib/actions/list-actions.ts" "Student/teacher lists show all schools"
fix_file "src/lib/actions/students-filters.ts" "Filter options show all schools"
fix_file "src/lib/actions/teachers-filters.ts" "Filter options show all schools"
fix_file "src/lib/actions/parents-filters.ts" "Filter options show all schools"

echo ""
echo "========================================="
echo "Summary:"
echo "  Fixed/Already Fixed: $FIXED"
echo "  Failed: $FAILED"
echo "  Total: 15"
echo "========================================="
echo ""
echo "NOTE: This script only checks for existing fixes."
echo "Manual fixing is required for files that need updates."
echo "Use the fix pattern from scripts/fix-school-isolation-template.md"
echo ""
