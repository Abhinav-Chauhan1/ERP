#!/usr/bin/env tsx
/**
 * Lighthouse Performance Audit Script
 * 
 * This script runs Lighthouse audits on all major pages of the ERP system
 * and generates a comprehensive performance report.
 * 
 * Usage: tsx scripts/lighthouse-audit.ts
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

interface LighthouseResult {
  url: string;
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  cls: number; // Cumulative Layout Shift
  tbt: number; // Total Blocking Time
  si: number;  // Speed Index
}

// Major pages to audit
const PAGES_TO_AUDIT = [
  { name: 'Home', path: '/' },
  { name: 'Admin Dashboard', path: '/admin' },
  { name: 'Student Dashboard', path: '/student' },
  { name: 'Teacher Dashboard', path: '/teacher' },
  { name: 'Parent Dashboard', path: '/parent' },
  { name: 'Admin Students List', path: '/admin/users/students' },
  { name: 'Admin Classes', path: '/admin/classes' },
  { name: 'Admin Attendance', path: '/admin/attendance' },
  { name: 'Admin Finance', path: '/admin/finance' },
  { name: 'Student Academics', path: '/student/academics' },
  { name: 'Student Attendance', path: '/student/attendance' },
  { name: 'Teacher Courses', path: '/teacher/courses' },
  { name: 'Parent Children', path: '/parent/children' },
];

const BASE_URL = process.env.LIGHTHOUSE_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(process.cwd(), 'lighthouse-reports');

async function ensureOutputDir() {
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating output directory:', error);
  }
}

async function runLighthouseAudit(url: string, name: string): Promise<LighthouseResult | null> {
  try {
    console.log(`\n🔍 Auditing: ${name} (${url})`);
    
    const outputPath = path.join(OUTPUT_DIR, `${name.replace(/\s+/g, '-').toLowerCase()}.json`);
    
    // Run Lighthouse CLI
    const command = `npx lighthouse ${url} \
      --output=json \
      --output-path="${outputPath}" \
      --chrome-flags="--headless --no-sandbox --disable-gpu" \
      --only-categories=performance,accessibility,best-practices,seo \
      --quiet`;
    
    await execAsync(command);
    
    // Read and parse results
    const reportData = await fs.readFile(outputPath, 'utf-8');
    const report = JSON.parse(reportData);
    
    const result: LighthouseResult = {
      url,
      performance: Math.round(report.categories.performance.score * 100),
      accessibility: Math.round(report.categories.accessibility.score * 100),
      bestPractices: Math.round(report.categories['best-practices'].score * 100),
      seo: Math.round(report.categories.seo.score * 100),
      fcp: report.audits['first-contentful-paint'].numericValue,
      lcp: report.audits['largest-contentful-paint'].numericValue,
      cls: report.audits['cumulative-layout-shift'].numericValue,
      tbt: report.audits['total-blocking-time'].numericValue,
      si: report.audits['speed-index'].numericValue,
    };
    
    console.log(`✅ Performance: ${result.performance}/100`);
    console.log(`   Accessibility: ${result.accessibility}/100`);
    console.log(`   Best Practices: ${result.bestPractices}/100`);
    console.log(`   SEO: ${result.seo}/100`);
    console.log(`   FCP: ${(result.fcp / 1000).toFixed(2)}s`);
    console.log(`   LCP: ${(result.lcp / 1000).toFixed(2)}s`);
    console.log(`   CLS: ${result.cls.toFixed(3)}`);
    
    return result;
  } catch (error) {
    console.error(`❌ Error auditing ${name}:`, error);
    return null;
  }
}

async function generateSummaryReport(results: LighthouseResult[]) {
  const validResults = results.filter(r => r !== null);
  
  if (validResults.length === 0) {
    console.log('\n❌ No valid results to generate summary');
    return;
  }
  
  const avgPerformance = validResults.reduce((sum, r) => sum + r.performance, 0) / validResults.length;
  const avgAccessibility = validResults.reduce((sum, r) => sum + r.accessibility, 0) / validResults.length;
  const avgBestPractices = validResults.reduce((sum, r) => sum + r.bestPractices, 0) / validResults.length;
  const avgSeo = validResults.reduce((sum, r) => sum + r.seo, 0) / validResults.length;
  
  const summary = `
# Lighthouse Performance Audit Summary
Generated: ${new Date().toISOString()}

## Overall Scores
- **Average Performance**: ${avgPerformance.toFixed(1)}/100 ${avgPerformance >= 90 ? '✅' : '⚠️'}
- **Average Accessibility**: ${avgAccessibility.toFixed(1)}/100 ${avgAccessibility >= 90 ? '✅' : '⚠️'}
- **Average Best Practices**: ${avgBestPractices.toFixed(1)}/100 ${avgBestPractices >= 90 ? '✅' : '⚠️'}
- **Average SEO**: ${avgSeo.toFixed(1)}/100 ${avgSeo >= 90 ? '✅' : '⚠️'}

## Pages Audited: ${validResults.length}

${validResults.map(r => `
### ${r.url}
- Performance: ${r.performance}/100 ${r.performance >= 90 ? '✅' : '⚠️'}
- Accessibility: ${r.accessibility}/100
- Best Practices: ${r.bestPractices}/100
- SEO: ${r.seo}/100
- FCP: ${(r.fcp / 1000).toFixed(2)}s
- LCP: ${(r.lcp / 1000).toFixed(2)}s
- CLS: ${r.cls.toFixed(3)} ${r.cls < 0.1 ? '✅' : '⚠️'}
- TBT: ${r.tbt.toFixed(0)}ms
- SI: ${(r.si / 1000).toFixed(2)}s
`).join('\n')}

## Recommendations

${avgPerformance < 90 ? `
### Performance Improvements Needed
- Consider implementing code splitting for large bundles
- Optimize images and use modern formats (WebP, AVIF)
- Implement lazy loading for below-the-fold content
- Minimize JavaScript execution time
- Reduce server response times
` : '✅ Performance targets met!'}

${validResults.some(r => r.cls >= 0.1) ? `
### Layout Stability Issues
- Add explicit dimensions to images
- Reserve space for dynamic content
- Use skeleton loaders
- Optimize font loading
` : '✅ Layout stability is good!'}

${avgAccessibility < 90 ? `
### Accessibility Improvements Needed
- Add ARIA labels to interactive elements
- Ensure sufficient color contrast
- Add alt text to images
- Improve keyboard navigation
` : '✅ Accessibility targets met!'}
`;
  
  const summaryPath = path.join(OUTPUT_DIR, 'SUMMARY.md');
  await fs.writeFile(summaryPath, summary);
  
  console.log('\n' + summary);
  console.log(`\n📊 Full report saved to: ${OUTPUT_DIR}`);
}

async function main() {
  console.log('🚀 Starting Lighthouse Performance Audit');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`📁 Output Directory: ${OUTPUT_DIR}`);
  
  await ensureOutputDir();
  
  const results: (LighthouseResult | null)[] = [];
  
  for (const page of PAGES_TO_AUDIT) {
    const url = `${BASE_URL}${page.path}`;
    const result = await runLighthouseAudit(url, page.name);
    results.push(result);
    
    // Add delay between audits to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  await generateSummaryReport(results.filter(r => r !== null) as LighthouseResult[]);
  
  console.log('\n✨ Audit complete!');
}

main().catch(console.error);
