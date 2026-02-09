#!/bin/bash

# Script to find all references to old settings models in the codebase
# This helps identify files that need to be updated after the migration

echo "🔍 Searching for references to old settings models..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to search and display results
search_pattern() {
    local pattern=$1
    local description=$2
    
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Searching for: ${description}${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Search in src directory, excluding node_modules and .next
    results=$(grep -r "$pattern" src/ --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git -n 2>/dev/null)
    
    if [ -z "$results" ]; then
        echo -e "${GREEN}✓ No references found${NC}"
    else
        echo -e "${RED}Found references:${NC}"
        echo "$results" | while IFS= read -r line; do
            echo "  $line"
        done
        echo ""
        count=$(echo "$results" | wc -l)
        echo -e "${RED}Total: $count reference(s)${NC}"
    fi
    echo ""
}

# Search for SystemSettings
search_pattern "systemSettings" "systemSettings (camelCase variable)"
search_pattern "SystemSettings" "SystemSettings (PascalCase type/model)"
search_pattern "system_settings" "system_settings (snake_case table)"

# Search for SchoolSecuritySettings
search_pattern "schoolSecuritySettings" "schoolSecuritySettings (camelCase variable)"
search_pattern "SchoolSecuritySettings" "SchoolSecuritySettings (PascalCase type/model)"

# Search for SchoolDataManagementSettings
search_pattern "schoolDataManagementSettings" "schoolDataManagementSettings (camelCase variable)"
search_pattern "SchoolDataManagementSettings" "SchoolDataManagementSettings (PascalCase type/model)"

# Search for SchoolNotificationSettings
search_pattern "schoolNotificationSettings" "schoolNotificationSettings (camelCase variable)"
search_pattern "SchoolNotificationSettings" "SchoolNotificationSettings (PascalCase type/model)"

# Search for old relation names in School model
search_pattern "securitySettings:" "securitySettings relation"
search_pattern "dataManagementSettings:" "dataManagementSettings relation"
search_pattern "notificationSettings:" "notificationSettings relation"

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Search complete!${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📝 Next steps:"
echo "  1. Review all found references above"
echo "  2. Update each file to use the new SchoolSettings model"
echo "  3. Replace old model names with 'schoolSettings' or 'SchoolSettings'"
echo "  4. Test thoroughly after changes"
echo ""
echo "💡 Example replacements:"
echo "  OLD: const systemSettings = await prisma.systemSettings.findUnique(...);"
echo "  NEW: const settings = await prisma.schoolSettings.findUnique(...);"
echo ""
echo "  OLD: include: { systemSettings: true, securitySettings: true }"
echo "  NEW: include: { settings: true }"
echo ""
