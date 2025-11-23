#!/usr/bin/env tsx
/**
 * Bundle Size Analysis Script
 * 
 * Analyzes the Next.js build output to identify large bundles
 * and opportunities for optimization.
 * 
 * Usage: npm run build && tsx scripts/analyze-bundle.ts
 */

import * as fs from 'fs/promises';
import * as path from 'path';

interface BundleInfo {
  name: string;
  size: number;
  gzipSize?: number;
  type: 'page' | 'chunk' | 'static';
}

async function analyzeBuildOutput() {
  const buildDir = path.join(process.cwd(), '.next');
  
  try {
    // Check if build exists
    await fs.access(buildDir);
  } catch {
    console.error('❌ No build found. Run "npm run build" first.');
    process.exit(1);
  }
  
  console.log('📦 Analyzing bundle sizes...\n');
  
  // Read build manifest
  const manifestPath = path.join(buildDir, 'build-manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
  
  const bundles: BundleInfo[] = [];
  
  // Analyze page bundles
  for (const [page, files] of Object.entries(manifest.pages)) {
    for (const file of files as string[]) {
      if (file.endsWith('.js')) {
        const filePath = path.join(buildDir, file);
        try {
          const stats = await fs.stat(filePath);
          bundles.push({
            name: `${page} -> ${path.basename(file)}`,
            size: stats.size,
            type: 'page',
          });
        } catch {
          // File might not exist
        }
      }
    }
  }
  
  // Sort by size
  bundles.sort((a, b) => b.size - a.size);
  
  // Display results
  console.log('📊 Largest Bundles:\n');
  console.log('Size (KB)  | Type | Bundle');
  console.log('-----------|------|-------');
  
  const largestBundles = bundles.slice(0, 20);
  for (const bundle of largestBundles) {
    const sizeKB = (bundle.size / 1024).toFixed(2);
    console.log(`${sizeKB.padStart(9)} | ${bundle.type.padEnd(4)} | ${bundle.name}`);
  }
  
  // Calculate totals
  const totalSize = bundles.reduce((sum, b) => sum + b.size, 0);
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
  
  console.log('\n📈 Summary:');
  console.log(`Total bundles: ${bundles.length}`);
  console.log(`Total size: ${totalSizeMB} MB`);
  
  // Identify optimization opportunities
  console.log('\n💡 Optimization Opportunities:\n');
  
  const largeBundles = bundles.filter(b => b.size > 200 * 1024); // > 200KB
  if (largeBundles.length > 0) {
    console.log(`⚠️  ${largeBundles.length} bundles are larger than 200KB:`);
    largeBundles.forEach(b => {
      console.log(`   - ${b.name}: ${(b.size / 1024).toFixed(2)} KB`);
    });
    console.log('   Consider code splitting or lazy loading for these bundles.\n');
  }
  
  // Check for duplicate dependencies
  const fileNames = bundles.map(b => b.name.split(' -> ')[1]);
  const duplicates = fileNames.filter((name, index) => fileNames.indexOf(name) !== index);
  
  if (duplicates.length > 0) {
    console.log(`⚠️  Potential duplicate chunks detected:`);
    console.log(`   ${[...new Set(duplicates)].join(', ')}`);
    console.log('   Consider optimizing chunk splitting strategy.\n');
  }
  
  // Recommendations
  console.log('📝 Recommendations:');
  console.log('   1. Use dynamic imports for large components');
  console.log('   2. Implement route-based code splitting');
  console.log('   3. Lazy load heavy libraries (charts, editors, etc.)');
  console.log('   4. Use Next.js built-in optimizations');
  console.log('   5. Consider using webpack-bundle-analyzer for detailed analysis');
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    totalBundles: bundles.length,
    totalSize: totalSize,
    totalSizeMB: parseFloat(totalSizeMB),
    largestBundles: largestBundles.map(b => ({
      name: b.name,
      sizeKB: parseFloat((b.size / 1024).toFixed(2)),
    })),
    largeBundles: largeBundles.length,
    recommendations: [
      'Implement code splitting for bundles > 200KB',
      'Use dynamic imports for heavy components',
      'Optimize third-party dependencies',
    ],
  };
  
  const reportPath = path.join(process.cwd(), 'bundle-analysis.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n✅ Report saved to: ${reportPath}`);
}

analyzeBuildOutput().catch(console.error);
