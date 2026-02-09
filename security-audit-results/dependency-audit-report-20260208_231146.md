# Dependency Security Audit Report
Generated: Sun Feb  8 11:11:46 PM IST 2026

## NPM Audit Results

```
# npm audit report

diff  4.0.0 - 4.0.3
jsdiff has a Denial of Service vulnerability in parsePatch and applyPatch - https://github.com/advisories/GHSA-73rr-hh4g-fpgx
fix available via `npm audit fix`
node_modules/diff

fast-xml-parser  4.3.6 - 5.3.3
Severity: high
fast-xml-parser has RangeError DoS Numeric Entities Bug - https://github.com/advisories/GHSA-37qj-frw5-hhjh
fix available via `npm audit fix`
node_modules/fast-xml-parser
  @aws-sdk/xml-builder  3.894.0 - 3.972.2
  Depends on vulnerable versions of fast-xml-parser
  node_modules/@aws-sdk/xml-builder

jspdf  <=4.0.0
Severity: high
jsPDF has PDF Injection in AcroFormChoiceField that allows Arbitrary JavaScript Execution - https://github.com/advisories/GHSA-pqxr-3g65-p328
jsPDF Vulnerable to Denial of Service (DoS) via Unvalidated BMP Dimensions in BMPDecoder - https://github.com/advisories/GHSA-95fx-jjr5-f39c
jsPDF Vulnerable to Stored XMP Metadata Injection (Spoofing & Integrity Violation) - https://github.com/advisories/GHSA-vm32-vv63-w422
jsPDF has Shared State Race Condition in addJS Plugin - https://github.com/advisories/GHSA-cjw8-79x6-5cj4
fix available via `npm audit fix`
node_modules/jspdf

lodash  4.0.0 - 4.17.21
Severity: moderate
Lodash has Prototype Pollution Vulnerability in `_.unset` and `_.omit` functions - https://github.com/advisories/GHSA-xxjr-mmjv-4gpg
fix available via `npm audit fix`
node_modules/lodash

next  15.6.0-canary.0 - 16.1.4
Severity: high
Next.js self-hosted applications vulnerable to DoS via Image Optimizer remotePatterns configuration - https://github.com/advisories/GHSA-9g9p-9gw9-jx7f
Next.js HTTP request deserialization can lead to DoS when using insecure React Server Components - https://github.com/advisories/GHSA-h25m-26qc-wcjf
Next.js has Unbounded Memory Consumption via PPR Resume Endpoint  - https://github.com/advisories/GHSA-5f7q-jpqc-wp7h
fix available via `npm audit fix --force`
Will install next@16.1.6, which is outside the stated dependency range
node_modules/next

6 vulnerabilities (1 low, 1 moderate, 4 high)

To address issues that do not require attention, run:
  npm audit fix

To address all issues, run:
  npm audit fix --force
Vulnerabilities detected (see above)
```

