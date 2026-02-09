#!/bin/bash

# Comprehensive School Isolation Audit Script
# This script searches for potential school isolation violations

echo "=========================================="
echo "School Isolation Comprehensive Audit"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Counter for issues found
ISSUES=0

echo "1. Checking for findUnique without schoolId filter..."
echo "   (These should use findFirst with schoolId)"
echo ""

# Find all findUnique calls in admin pages and API routes
grep -rn "findUnique" src/app/admin --include="*.tsx" --include="*.ts" | \
  grep -v "schoolId" | \
  grep -v "node_modules" | \
  grep -v ".next" | \
  while read -r line; do
    echo -e "${RED}⚠️  $line${NC}"
    ((ISSUES++))
  done

grep -rn "findUnique" src/app/api --include="*.ts" | \
  grep -v "schoolId" | \
  grep -v "super-admin" | \
  grep -v "node_modules" | \
  grep -v ".next" | \
  while read -r line; do
    echo -e "${RED}⚠️  $line${NC}"
    ((ISSUES++))
  done

echo ""
echo "2. Checking for findMany without schoolId filter..."
echo "   (These should filter by schoolId)"
echo ""

# Find findMany calls that might be missing schoolId
grep -rn "findMany" src/app/admin --include="*.tsx" --include="*.ts" -A 3 | \
  grep -B 3 "where:" | \
  grep -v "schoolId" | \
  grep -v "node_modules" | \
  grep -v ".next" | \
  head -20 | \
  while read -r line; do
    echo -e "${YELLOW}⚠️  $line${NC}"
  done

echo ""
echo "3. Checking server actions for school isolation..."
echo "   (Actions should use requireSchoolAccess or getRequiredSchoolId)"
echo ""

# Check actions that might be missing school context
find src/lib/actions -name "*.ts" -type f | while read -r file; do
  if grep -q "export async function" "$file"; then
    if ! grep -q "requireSchoolAccess\|getRequiredSchoolId\|schoolId" "$file"; then
      echo -e "${YELLOW}⚠️  $file - No school context check found${NC}"
      ((ISSUES++))
    fi
  fi
done

echo ""
echo "4. Checking API routes for authentication..."
echo "   (API routes should use withSchoolAuth or check schoolId)"
echo ""

# Check API routes that might be missing auth
find src/app/api -name "route.ts" -type f | \
  grep -v "super-admin" | \
  grep -v "auth" | \
  grep -v "webhook" | \
  while read -r file; do
    if ! grep -q "withSchoolAuth\|getRequiredSchoolId\|requireSchoolAccess" "$file"; then
      echo -e "${YELLOW}⚠️  $file - No school auth check found${NC}"
    fi
  done

echo ""
echo "5. Checking for direct user queries without school filter..."
echo "   (User queries should always include schoolId)"
echo ""

# Check for student/teacher/parent queries without schoolId
for entity in "student" "teacher" "parent" "administrator"; do
  echo "   Checking $entity queries..."
  grep -rn "db\.$entity\.find" src/app/admin --include="*.tsx" --include="*.ts" -A 5 | \
    grep -B 5 "where:" | \
    grep -v "schoolId" | \
    head -10 | \
    while read -r line; do
      echo -e "${RED}⚠️  $line${NC}"
    done
done

echo ""
echo "6. Checking for enrollment/attendance queries without school filter..."
echo ""

for entity in "enrollment" "attendance" "examResult" "feePayment"; do
  echo "   Checking $entity queries..."
  grep -rn "db\.$entity\.find" src/app/admin --include="*.tsx" --include="*.ts" -A 5 | \
    grep -B 5 "where:" | \
    grep -v "schoolId" | \
    head -5 | \
    while read -r line; do
      echo -e "${YELLOW}⚠️  $line${NC}"
    done
done

echo ""
echo "=========================================="
echo "Audit Complete"
echo "=========================================="
echo ""
echo "Summary:"
echo "- Check all RED items immediately (P0 security issues)"
echo "- Review YELLOW items for potential issues (P1)"
echo ""
echo "Next steps:"
echo "1. Fix all findUnique calls to use findFirst with schoolId"
echo "2. Add schoolId filters to all findMany queries"
echo "3. Ensure all server actions have school context"
echo "4. Add withSchoolAuth to all API routes"
echo ""
