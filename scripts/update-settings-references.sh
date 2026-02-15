#!/bin/bash

# Script to automatically update all references from old settings models to new SchoolSettings model
# This performs safe find-and-replace operations

echo "🔄 Updating settings model references..."
echo ""

# Function to replace in files
replace_in_files() {
    local old_pattern=$1
    local new_pattern=$2
    local description=$3
    
    echo "📝 $description"
    
    # Use sed to replace in all TypeScript files
    find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s/$old_pattern/$new_pattern/g" {} +
    
    echo "   ✓ Done"
}

# 1. Update Prisma model references
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Updating Prisma model references"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

replace_in_files "db\.systemSettings" "db.schoolSettings" "systemSettings -> schoolSettings"
replace_in_files "prisma\.systemSettings" "prisma.schoolSettings" "prisma.systemSettings -> prisma.schoolSettings"
replace_in_files "db\.schoolSecuritySettings" "db.schoolSettings" "schoolSecuritySettings -> schoolSettings"
replace_in_files "db\.schoolDataManagementSettings" "db.schoolSettings" "schoolDataManagementSettings -> schoolSettings"
replace_in_files "db\.schoolNotificationSettings" "db.schoolSettings" "schoolNotificationSettings -> schoolSettings"

echo ""

# 2. Update type imports
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Updating type imports"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

replace_in_files "import { SystemSettings }" "import { SchoolSettings }" "SystemSettings type import"
replace_in_files "import { SchoolSecuritySettings }" "import { SchoolSettings }" "SchoolSecuritySettings type import"
replace_in_files "import { SchoolDataManagementSettings }" "import { SchoolSettings }" "SchoolDataManagementSettings type import"
replace_in_files "import { SchoolNotificationSettings }" "import { SchoolSettings }" "SchoolNotificationSettings type import"

echo ""

# 3. Update type annotations
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Updating type annotations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

replace_in_files ": SystemSettings" ": SchoolSettings" "SystemSettings type annotation"
replace_in_files ": SchoolSecuritySettings" ": SchoolSettings" "SchoolSecuritySettings type annotation"
replace_in_files ": SchoolDataManagementSettings" ": SchoolSettings" "SchoolDataManagementSettings type annotation"
replace_in_files ": SchoolNotificationSettings" ": SchoolSettings" "SchoolNotificationSettings type annotation"

replace_in_files "<SystemSettings>" "<SchoolSettings>" "SystemSettings generic type"
replace_in_files "<SchoolSecuritySettings>" "<SchoolSettings>" "SchoolSecuritySettings generic type"

echo ""

# 4. Update relation names in includes
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Updating relation names"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

replace_in_files "systemSettings:" "settings:" "systemSettings relation"
replace_in_files "securitySettings:" "settings:" "securitySettings relation"
replace_in_files "dataManagementSettings:" "settings:" "dataManagementSettings relation"
replace_in_files "notificationSettings:" "settings:" "notificationSettings relation"

echo ""

# 5. Update variable names (common patterns)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Updating variable names"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Note: We keep systemSettings variable name for backward compatibility
# but update the model references
echo "   ℹ️  Keeping variable names for backward compatibility"
echo "   ℹ️  Only updating model/type references"

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Update complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next steps:"
echo "  1. Review the changes with: git diff"
echo "  2. Run TypeScript check: npx tsc --noEmit"
echo "  3. Run tests: npm test"
echo "  4. Fix any remaining issues manually"
echo ""
