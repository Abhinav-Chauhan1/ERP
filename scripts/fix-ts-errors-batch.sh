#!/bin/bash

# Batch fix TypeScript errors related to unified auth refactor

echo "Fixing TypeScript errors in batch..."

# List of files to fix
FILES=(
  "src/app/api/calendar/events/route.ts"
  "src/app/api/calendar/export/route.ts"
  "src/app/api/calendar/preferences/route.ts"
  "src/app/api/payments/create/route.ts"
  "src/app/api/payments/verify/route.ts"
  "src/app/api/reports/batch-download/route.ts"
  "src/app/api/teacher/achievements/[id]/route.ts"
  "src/app/api/teacher/achievements/route.ts"
  "src/app/api/teacher/documents/route.ts"
  "src/app/api/teacher/events/[id]/rsvp/route.ts"
  "src/app/api/teacher/events/route.ts"
)

# Fix 1: Remove schoolId from User where clause
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    # Remove schoolId line from User findFirst where clause
    sed -i '/where: {/,/}/ { /schoolId.*CRITICAL.*Filter by school/d; }' "$file"
  fi
done

echo "Done! Run 'npx tsc --noEmit' to verify."
