/**
 * Verify Alumni Search Indexes
 * 
 * This script verifies that all required indexes for alumni search optimization
 * have been created successfully.
 * 
 * Requirements: 6.2, 6.3
 * 
 * Usage:
 *   npx tsx scripts/verify-alumni-indexes.ts
 */

import { db } from "@/lib/db";

// ============================================================================
// Expected Indexes
// ============================================================================

const EXPECTED_INDEXES = [
  {
    name: "alumni_graduationDate_idx",
    columns: ["graduationDate"],
    description: "Index for date-based filtering and sorting",
  },
  {
    name: "alumni_finalClass_idx",
    columns: ["finalClass"],
    description: "Index for class-based filtering",
  },
  {
    name: "alumni_currentCity_idx",
    columns: ["currentCity"],
    description: "Index for location-based searches",
  },
  {
    name: "alumni_collegeName_idx",
    columns: ["collegeName"],
    description: "Index for college-based searches",
  },
  {
    name: "alumni_currentOccupation_idx",
    columns: ["currentOccupation"],
    description: "Index for occupation-based searches",
  },
  {
    name: "alumni_currentEmployer_idx",
    columns: ["currentEmployer"],
    description: "Index for employer-based searches",
  },
  {
    name: "alumni_graduationDate_finalClass_idx",
    columns: ["graduationDate", "finalClass"],
    description: "Composite index for graduation date and class queries",
  },
  {
    name: "alumni_finalClass_graduationDate_idx",
    columns: ["finalClass", "graduationDate"],
    description: "Composite index for class-based queries with date sorting",
  },
  {
    name: "alumni_currentCity_currentOccupation_idx",
    columns: ["currentCity", "currentOccupation"],
    description: "Composite index for location and occupation queries",
  },
];

// ============================================================================
// Verification Functions
// ============================================================================

async function verifyIndexes() {
  console.log("=".repeat(80));
  console.log("Alumni Search Index Verification");
  console.log("=".repeat(80));
  console.log();

  try {
    // Query to get all indexes on the alumni table
    const indexQuery = `
      SELECT
        i.relname as index_name,
        a.attname as column_name,
        ix.indisprimary as is_primary,
        ix.indisunique as is_unique
      FROM
        pg_class t,
        pg_class i,
        pg_index ix,
        pg_attribute a
      WHERE
        t.oid = ix.indrelid
        AND i.oid = ix.indexrelid
        AND a.attrelid = t.oid
        AND a.attnum = ANY(ix.indkey)
        AND t.relkind = 'r'
        AND t.relname = 'alumni'
      ORDER BY
        i.relname,
        a.attnum;
    `;

    const indexes: any[] = await db.$queryRawUnsafe(indexQuery);

    // Group indexes by name
    const indexMap = new Map<string, any>();
    for (const index of indexes) {
      if (!indexMap.has(index.index_name)) {
        indexMap.set(index.index_name, {
          name: index.index_name,
          columns: [],
          isPrimary: index.is_primary,
          isUnique: index.is_unique,
        });
      }
      indexMap.get(index.index_name)!.columns.push(index.column_name);
    }

    console.log("📋 Found Indexes on 'alumni' table:");
    console.log("-".repeat(80));
    console.log();

    let foundCount = 0;
    let missingCount = 0;

    // Check each expected index
    for (const expectedIndex of EXPECTED_INDEXES) {
      const found = indexMap.has(expectedIndex.name);
      
      if (found) {
        const actualIndex = indexMap.get(expectedIndex.name)!;
        const columnsMatch = JSON.stringify(actualIndex.columns.sort()) === 
                            JSON.stringify(expectedIndex.columns.sort());
        
        if (columnsMatch) {
          console.log(`✅ ${expectedIndex.name}`);
          console.log(`   Columns: ${actualIndex.columns.join(", ")}`);
          console.log(`   Description: ${expectedIndex.description}`);
          foundCount++;
        } else {
          console.log(`⚠️  ${expectedIndex.name} (column mismatch)`);
          console.log(`   Expected: ${expectedIndex.columns.join(", ")}`);
          console.log(`   Actual: ${actualIndex.columns.join(", ")}`);
          missingCount++;
        }
      } else {
        console.log(`❌ ${expectedIndex.name} (not found)`);
        console.log(`   Expected columns: ${expectedIndex.columns.join(", ")}`);
        console.log(`   Description: ${expectedIndex.description}`);
        missingCount++;
      }
      console.log();
    }

    // Show all indexes (including system indexes)
    console.log("📊 All Indexes on 'alumni' table:");
    console.log("-".repeat(80));
    console.log();
    
    for (const [name, index] of indexMap.entries()) {
      const type = index.isPrimary ? "PRIMARY KEY" : 
                   index.isUnique ? "UNIQUE" : "INDEX";
      console.log(`  ${name} (${type})`);
      console.log(`    Columns: ${index.columns.join(", ")}`);
    }
    console.log();

    // Summary
    console.log("=".repeat(80));
    console.log("Verification Summary");
    console.log("=".repeat(80));
    console.log();
    console.log(`✅ Found: ${foundCount}/${EXPECTED_INDEXES.length} expected indexes`);
    
    if (missingCount > 0) {
      console.log(`❌ Missing: ${missingCount} indexes`);
      console.log();
      console.log("To create missing indexes, run:");
      console.log("  npx prisma migrate deploy");
      console.log();
      process.exit(1);
    } else {
      console.log("🎉 All expected indexes are present and correct!");
      console.log();
      console.log("Search optimization is properly configured:");
      console.log("  ✓ Single-column indexes for basic filtering");
      console.log("  ✓ Composite indexes for complex queries");
      console.log("  ✓ Indexes cover all common search patterns");
      console.log();
      console.log("Next steps:");
      console.log("  1. Create some alumni records using the promotion feature");
      console.log("  2. Run performance tests: npx tsx scripts/test-alumni-search-performance.ts");
      console.log("  3. Monitor query performance in production");
      console.log();
    }
  } catch (error) {
    console.error("❌ Error verifying indexes:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Run verification
verifyIndexes()
  .then(() => {
    console.log("✅ Verification completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });

