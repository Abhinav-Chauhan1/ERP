#!/bin/bash
# Dependency Security Audit
# Scans npm dependencies for known vulnerabilities

set -e

echo "================================================"
echo "Dependency Security Audit"
echo "================================================"
echo ""

OUTPUT_DIR="security-audit-results"
mkdir -p "$OUTPUT_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$OUTPUT_DIR/dependency-audit-report-$TIMESTAMP.md"

echo "# Dependency Security Audit Report" > "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 1. NPM Audit
echo "Running npm audit..."
echo "## NPM Audit Results" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "\`\`\`" >> "$REPORT_FILE"

if npm audit >> "$REPORT_FILE" 2>&1; then
    echo "No vulnerabilities found!" >> "$REPORT_FILE"
else
    echo "Vulnerabilities detected (see above)" >> "$REPORT_FILE"
fi

echo "\`\`\`" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Save JSON output for programmatic analysis
npm audit --json > "$OUTPUT_DIR/npm-audit-$TIMESTAMP.json" 2>/dev/null || true

# 2. Outdated Packages
echo "Checking for outdated packages..."
echo "## Outdated Packages" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "\`\`\`" >> "$REPORT_FILE"

npm outdated >> "$REPORT_FILE" 2>&1 || echo "All packages are up to date!" >> "$REPORT_FILE"

echo "\`\`\`" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Save JSON output
npm outdated --json > "$OUTPUT_DIR/npm-outdated-$TIMESTAMP.json" 2>/dev/null || true

# 3. License Check
echo "Checking package licenses..."
echo "## License Compliance" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if command -v npx &> /dev/null; then
    echo "\`\`\`" >> "$REPORT_FILE"
    npx license-checker --summary >> "$REPORT_FILE" 2>&1 || echo "license-checker not available" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
else
    echo "npx not available, skipping license check" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

# 4. Dependency Tree Depth
echo "Analyzing dependency tree..."
echo "## Dependency Tree Analysis" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

TOTAL_DEPS=$(npm list --all 2>/dev/null | wc -l || echo "0")
DIRECT_DEPS=$(npm list --depth=0 2>/dev/null | wc -l || echo "0")

echo "- **Total dependencies:** $TOTAL_DEPS" >> "$REPORT_FILE"
echo "- **Direct dependencies:** $DIRECT_DEPS" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 5. Check for known vulnerable packages
echo "Checking for known vulnerable packages..."
echo "## Known Vulnerable Packages" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

VULNERABLE_PACKAGES=(
    "event-stream"
    "flatmap-stream"
    "eslint-scope"
    "getcookies"
    "mailparser"
    "nodemailer"
)

echo "Scanning for historically vulnerable packages..." >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

for pkg in "${VULNERABLE_PACKAGES[@]}"; do
    if npm list "$pkg" &>/dev/null; then
        echo "⚠️  Found: $pkg (review version)" >> "$REPORT_FILE"
    fi
done

echo "" >> "$REPORT_FILE"

# 6. Summary Statistics
echo "## Summary Statistics" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Parse npm audit JSON for statistics
if [ -f "$OUTPUT_DIR/npm-audit-$TIMESTAMP.json" ]; then
    CRITICAL=$(jq '.metadata.vulnerabilities.critical // 0' "$OUTPUT_DIR/npm-audit-$TIMESTAMP.json" 2>/dev/null || echo "0")
    HIGH=$(jq '.metadata.vulnerabilities.high // 0' "$OUTPUT_DIR/npm-audit-$TIMESTAMP.json" 2>/dev/null || echo "0")
    MODERATE=$(jq '.metadata.vulnerabilities.moderate // 0' "$OUTPUT_DIR/npm-audit-$TIMESTAMP.json" 2>/dev/null || echo "0")
    LOW=$(jq '.metadata.vulnerabilities.low // 0' "$OUTPUT_DIR/npm-audit-$TIMESTAMP.json" 2>/dev/null || echo "0")
    
    echo "### Vulnerability Severity" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "- **Critical:** $CRITICAL" >> "$REPORT_FILE"
    echo "- **High:** $HIGH" >> "$REPORT_FILE"
    echo "- **Moderate:** $MODERATE" >> "$REPORT_FILE"
    echo "- **Low:** $LOW" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    TOTAL_VULNS=$((CRITICAL + HIGH + MODERATE + LOW))
    echo "**Total vulnerabilities:** $TOTAL_VULNS" >> "$REPORT_FILE"
else
    echo "Unable to parse vulnerability statistics" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

# 7. Recommendations
echo "## Recommendations" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "1. Review and fix all CRITICAL and HIGH severity vulnerabilities immediately" >> "$REPORT_FILE"
echo "2. Update outdated packages, especially those with security patches" >> "$REPORT_FILE"
echo "3. Review license compliance for all dependencies" >> "$REPORT_FILE"
echo "4. Consider using \`npm audit fix\` to automatically fix vulnerabilities" >> "$REPORT_FILE"
echo "5. Set up automated dependency scanning in CI/CD pipeline" >> "$REPORT_FILE"
echo "6. Use tools like Snyk or Dependabot for continuous monitoring" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 8. Remediation Commands
echo "## Remediation Commands" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "\`\`\`bash" >> "$REPORT_FILE"
echo "# Fix vulnerabilities automatically (where possible)" >> "$REPORT_FILE"
echo "npm audit fix" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "# Fix vulnerabilities including breaking changes" >> "$REPORT_FILE"
echo "npm audit fix --force" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "# Update all packages to latest versions" >> "$REPORT_FILE"
echo "npm update" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "# Update specific package" >> "$REPORT_FILE"
echo "npm update <package-name>" >> "$REPORT_FILE"
echo "\`\`\`" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "Scan completed at: $(date)" >> "$REPORT_FILE"

echo "================================================"
echo "Dependency audit complete!"
echo "Report saved to: $REPORT_FILE"
echo ""

if [ -f "$OUTPUT_DIR/npm-audit-$TIMESTAMP.json" ]; then
    TOTAL_VULNS=$(jq '.metadata.vulnerabilities | add' "$OUTPUT_DIR/npm-audit-$TIMESTAMP.json" 2>/dev/null || echo "0")
    echo "Total vulnerabilities found: $TOTAL_VULNS"
fi

echo "================================================"

# Open report if on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "$REPORT_FILE"
fi
