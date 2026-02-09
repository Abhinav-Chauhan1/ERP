#!/bin/bash
# Security Anti-Pattern Scanner
# Scans for common security vulnerabilities and anti-patterns

set -e

echo "================================================"
echo "Security Anti-Pattern Scanner"
echo "================================================"
echo ""

OUTPUT_DIR="security-audit-results"
mkdir -p "$OUTPUT_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$OUTPUT_DIR/security-patterns-report-$TIMESTAMP.md"

echo "# Security Anti-Pattern Audit Report" > "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Function to scan and report
scan_security_pattern() {
    local pattern=$1
    local title=$2
    local severity=$3
    local description=$4
    
    echo "Scanning: $title..."
    echo "## $title" >> "$REPORT_FILE"
    echo "**Severity:** $severity" >> "$REPORT_FILE"
    echo "**Description:** $description" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    
    if command -v rg &> /dev/null; then
        COUNT=$(rg "$pattern" src/ -c 2>/dev/null | awk -F: '{sum+=$2} END {print sum}' || echo "0")
        rg "$pattern" src/ -n --no-heading 2>/dev/null >> "$REPORT_FILE" || echo "No issues found"
    else
        COUNT=$(grep -r "$pattern" src/ 2>/dev/null | wc -l || echo "0")
        grep -r -n "$pattern" src/ 2>/dev/null >> "$REPORT_FILE" || echo "No issues found"
    fi
    
    echo "\`\`\`" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "**Total occurrences:** $COUNT" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "---" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
}

# 1. Console.log statements (info leakage)
scan_security_pattern \
    "console\.(log|debug|info)" \
    "Console Logging Statements" \
    "MEDIUM" \
    "Console statements can leak sensitive information in production"

# 2. dangerouslySetInnerHTML (XSS risk)
scan_security_pattern \
    "dangerouslySetInnerHTML" \
    "Dangerous HTML Injection" \
    "HIGH" \
    "Using dangerouslySetInnerHTML can lead to XSS vulnerabilities"

# 3. eval() usage (code injection)
scan_security_pattern \
    "eval\(" \
    "Eval Usage" \
    "CRITICAL" \
    "eval() can execute arbitrary code and is a major security risk"

# 4. Raw SQL queries
scan_security_pattern \
    "\\\$queryRaw|\\\$executeRaw" \
    "Raw SQL Queries" \
    "HIGH" \
    "Raw SQL queries can be vulnerable to SQL injection"

# 5. Hardcoded secrets
scan_security_pattern \
    "(password|secret|apiKey|api_key|token).*=.*['\"][^$]" \
    "Hardcoded Secrets" \
    "CRITICAL" \
    "Hardcoded secrets should be moved to environment variables"

# 6. innerHTML usage
scan_security_pattern \
    "\.innerHTML\s*=" \
    "innerHTML Assignment" \
    "HIGH" \
    "Direct innerHTML assignment can lead to XSS vulnerabilities"

# 7. Unvalidated redirects
scan_security_pattern \
    "redirect\(.*\\\$\{|window\.location.*=.*\\\$\{" \
    "Unvalidated Redirects" \
    "MEDIUM" \
    "Unvalidated redirects can be used for phishing attacks"

# 8. Missing error handling
scan_security_pattern \
    "async.*function.*\{[^}]*await[^}]*\}(?!.*catch)" \
    "Missing Error Handling" \
    "MEDIUM" \
    "Async functions without try-catch can cause unhandled rejections"

# 9. Weak password validation
scan_security_pattern \
    "password.*length.*<.*[0-7]" \
    "Weak Password Requirements" \
    "HIGH" \
    "Password requirements should enforce minimum 8 characters"

# 10. Missing CSRF protection
scan_security_pattern \
    "export.*async.*function.*(POST|PUT|DELETE)(?!.*csrf)" \
    "Missing CSRF Protection" \
    "HIGH" \
    "State-changing operations should have CSRF protection"

# 11. Unescaped user input in JSX
scan_security_pattern \
    "\{.*user\.|.*student\.|.*parent\..*\}" \
    "Potential Unescaped User Input" \
    "MEDIUM" \
    "User input should be properly escaped to prevent XSS"

# 12. Missing authentication checks
scan_security_pattern \
    "export.*async.*function.*(GET|POST)(?!.*auth|.*session)" \
    "Missing Authentication Checks" \
    "CRITICAL" \
    "API routes should verify authentication"

# 13. Insecure random number generation
scan_security_pattern \
    "Math\.random\(\)" \
    "Insecure Random Number Generation" \
    "MEDIUM" \
    "Use crypto.randomBytes() for security-sensitive random values"

# 14. Missing input validation
scan_security_pattern \
    "request\.(json|formData)\(\)(?!.*validate|.*parse|.*schema)" \
    "Missing Input Validation" \
    "HIGH" \
    "All user inputs should be validated"

# 15. Exposed environment variables
scan_security_pattern \
    "process\.env\.(?!NODE_ENV|NEXT_PUBLIC)" \
    "Environment Variable Usage" \
    "INFO" \
    "Review environment variable usage for sensitive data"

echo "" >> "$REPORT_FILE"
echo "## Summary" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Scan completed at: $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Generate summary statistics
echo "### Severity Breakdown" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
CRITICAL_COUNT=$(grep -c "Severity: CRITICAL" "$REPORT_FILE" || echo "0")
HIGH_COUNT=$(grep -c "Severity: HIGH" "$REPORT_FILE" || echo "0")
MEDIUM_COUNT=$(grep -c "Severity: MEDIUM" "$REPORT_FILE" || echo "0")
LOW_COUNT=$(grep -c "Severity: LOW" "$REPORT_FILE" || echo "0")

echo "- **CRITICAL:** $CRITICAL_COUNT issues" >> "$REPORT_FILE"
echo "- **HIGH:** $HIGH_COUNT issues" >> "$REPORT_FILE"
echo "- **MEDIUM:** $MEDIUM_COUNT issues" >> "$REPORT_FILE"
echo "- **LOW:** $LOW_COUNT issues" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "================================================"
echo "Scan complete!"
echo "Report saved to: $REPORT_FILE"
echo ""
echo "Severity Breakdown:"
echo "  CRITICAL: $CRITICAL_COUNT"
echo "  HIGH: $HIGH_COUNT"
echo "  MEDIUM: $MEDIUM_COUNT"
echo "  LOW: $LOW_COUNT"
echo "================================================"

# Open report if on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "$REPORT_FILE"
fi
