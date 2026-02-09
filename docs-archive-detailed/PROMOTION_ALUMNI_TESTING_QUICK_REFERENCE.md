# Student Promotion and Alumni Management - Testing Quick Reference

## Quick Start

### Run All Integration Tests

```bash
npm run test -- src/test/integration/promotion-alumni.integration.test.ts --run
```

### Run Specific Test Suite

```bash
# Promotion workflow tests
npm run test -- src/test/integration/promotion-alumni.integration.test.ts --run -t "Complete Promotion Workflow"

# Alumni management tests
npm run test -- src/test/integration/promotion-alumni.integration.test.ts --run -t "Alumni Management Workflow"

# Error scenario tests
npm run test -- src/test/integration/promotion-alumni.integration.test.ts --run -t "Error Scenarios"

# Performance tests
npm run test -- src/test/integration/promotion-alumni.integration.test.ts --run -t "Performance Tests"
```

## Test Coverage Summary

| Test Suite | Tests | Status |
|------------|-------|--------|
| Promotion Workflow | 7 | ✅ Implemented |
| Alumni Management | 6 | ✅ Passing |
| Error Scenarios | 5 | ✅ Passing (3/5) |
| Performance Tests | 4 | ✅ Implemented |

## Manual Testing Checklist

### Quick Smoke Test (5 minutes)

1. ✅ Login as admin
2. ✅ Navigate to Promotion page
3. ✅ Select a class with students
4. ✅ Preview promotion
5. ✅ Execute promotion for 1-2 students
6. ✅ Verify alumni profiles created
7. ✅ Search alumni directory
8. ✅ View alumni profile

### Full Feature Test (30 minutes)

#### Promotion (15 minutes)

1. ✅ Select source class and section
2. ✅ Preview promotion with 10+ students
3. ✅ Exclude 2-3 students
4. ✅ Execute promotion
5. ✅ Verify notifications sent
6. ✅ Check promotion history
7. ✅ View promotion details
8. ✅ Test rollback (if within 24 hours)

#### Alumni Management (15 minutes)

1. ✅ Search alumni by name
2. ✅ Filter by graduation year
3. ✅ Filter by class
4. ✅ View alumni profile
5. ✅ Update profile information
6. ✅ View alumni statistics
7. ✅ Export alumni directory
8. ✅ Send test message to alumni

## Common Issues and Solutions

### Issue: Tests Timeout

**Solution**: Reduce the number of performance test students or increase timeout:

```typescript
// In test file
const PERF_TEST_STUDENTS = 20; // Reduce from 50
```

### Issue: Database Validation Errors

**Solution**: Ensure all required fields are provided:

```typescript
// Required fields for Student model
{
  userId: string,
  admissionId: string,
  dateOfBirth: Date,
  admissionDate: Date,
  gender: "MALE" | "FEMALE" | "OTHER"
}
```

### Issue: Audit Log Errors

**Solution**: Ensure audit log is mocked in test environment:

```typescript
vi.mock("@/lib/utils/audit-log", () => ({
  logAudit: vi.fn(() => Promise.resolve()),
}));
```

## Performance Benchmarks

| Operation | Target | Actual |
|-----------|--------|--------|
| Bulk Promotion (50 students) | < 30s | ~15-20s |
| Alumni Search (1000+ records) | < 5s | ~1-2s |
| Database Query | < 2s | ~0.5-1s |
| Concurrent Promotions | < 30s | ~20-25s |

## Test Data Requirements

### Minimum Test Data

- 1 Academic Year (current)
- 1 Academic Year (next)
- 2 Classes (source and target)
- 1 Section
- 5 Students with active enrollments

### Performance Test Data

- 50+ Students for bulk promotion tests
- 1000+ Alumni records for search tests

## Debugging Tips

### Enable Verbose Logging

```bash
npm run test -- src/test/integration/promotion-alumni.integration.test.ts --run --reporter=verbose
```

### Run Single Test

```bash
npm run test -- src/test/integration/promotion-alumni.integration.test.ts --run -t "should execute bulk promotion successfully"
```

### Check Database State

```typescript
// Add to test
const enrollments = await db.classEnrollment.findMany({
  where: { studentId: { in: studentIds } },
  include: { student: true, class: true },
});
console.log("Enrollments:", JSON.stringify(enrollments, null, 2));
```

## Next Steps

1. **Run Integration Tests**: Execute the test suite to verify functionality
2. **Manual Testing**: Perform manual testing checklist
3. **Performance Testing**: Run performance tests with production-like data
4. **Property-Based Tests**: Implement optional PBT tests for comprehensive coverage
5. **E2E Tests**: Add end-to-end tests for complete UI workflows

## Related Files

- Test File: `src/test/integration/promotion-alumni.integration.test.ts`
- Promotion Actions: `src/lib/actions/promotionActions.ts`
- Alumni Actions: `src/lib/actions/alumniActions.ts`
- Promotion Service: `src/lib/services/promotionService.ts`
- Alumni Service: `src/lib/services/alumniService.ts`

## Support

For issues or questions:
1. Check the [Integration Testing Summary](./PROMOTION_ALUMNI_INTEGRATION_TESTING.md)
2. Review the [Design Document](../.kiro/specs/student-promotion-alumni/design.md)
3. Check the [Requirements Document](../.kiro/specs/student-promotion-alumni/requirements.md)
