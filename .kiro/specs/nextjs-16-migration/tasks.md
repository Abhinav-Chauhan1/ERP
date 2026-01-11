# Implementation Plan: Next.js 16 Migration

## Overview

This implementation plan breaks down the Next.js 16 migration into discrete, actionable tasks. Each task builds on previous tasks and includes specific requirements references. The plan follows the five-phase approach outlined in the design document.

## Tasks

- [x] 1. Phase 1: Preparation and Baseline
  - Create migration branch and establish baseline metrics
  - _Requirements: All requirements (baseline for comparison)_

- [x] 1.1 Create migration branch and backup
  - Create git branch `feature/nextjs-16-migration`
  - Create backup checkpoint with current package-lock.json
  - Document current git commit hash
  - _Requirements: 15.1, 15.2_

- [x] 1.2 Document baseline performance metrics
  - Measure and record current build time
  - Measure and record dev server startup time
  - Measure and record page load times for key routes
  - Measure and record bundle sizes
  - Create baseline-metrics.json file
  - _Requirements: 14.1, 14.2, 14.3_

- [x] 1.3 Audit affected files
  - List all files using params/searchParams (already identified: 50+ files)
  - List all files using cookies() (4 files identified)
  - List all files using headers() (4 files identified)
  - Create affected-files.json manifest
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 2. Phase 2: Dependency Updates
  - Update all package dependencies to Next.js 16 and React 19 compatible versions
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

- [x] 2.1 Update package.json dependencies
  - Update next to 16.1.1
  - Update react to ^19.2.0
  - Update react-dom to ^19.2.0
  - Update @types/react to ^18.3.1
  - Update @types/react-dom to ^18.3.1
  - Update eslint-config-next to 16.1.1
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7_

- [x] 2.2 Update Radix UI packages
  - Update all @radix-ui/* packages to latest versions
  - Run: `npm update @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-popover @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slot @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-tooltip`
  - _Requirements: 1.6, 10.1_

- [x] 2.3 Install dependencies and verify
  - Run `npm install`
  - Verify no peer dependency conflicts
  - Verify installation completes successfully (exit code 0)
  - _Requirements: 1.8, 1.9_

- [ ]* 2.4 Write unit test for dependency versions
  - Test that package.json contains correct versions
  - Test that React >= 19.2
  - Test that React DOM >= 19.2
  - Test that Next.js = 16.1.1
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 3. Checkpoint - Verify dependencies installed
  - Ensure all tests pass, ask the user if questions arise.

- [-] 4. Phase 3: Automated Code Migration
  - Run Next.js codemod to automatically migrate code patterns
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [-] 4.1 Run Next.js upgrade codemod
  - Execute: `npx @next/codemod@canary upgrade latest`
  - Review codemod output and changes
  - Commit codemod changes separately
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 4.2 Generate TypeScript types for routes
  - Execute: `npx next typegen`
  - Verify types generated in .next/types
  - Review generated types for correctness
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 4.3 Write property test for server component async params
  - **Property 2: Server Component Async Params**
  - **Validates: Requirements 2.1, 2.7**
  - Test that all server components with params use await
  - Test that params is typed as Promise

- [ ]* 4.4 Write property test for server component async searchParams
  - **Property 3: Server Component Async SearchParams**
  - **Validates: Requirements 2.2, 2.8**
  - Test that all server components with searchParams use await
  - Test that searchParams is typed as Promise

- [ ] 5. Phase 4: Middleware Migration
  - Rename middleware to proxy and update exports
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 5.1 Rename middleware file
  - Rename src/middleware.ts to src/proxy.ts
  - Update any imports referencing middleware.ts
  - _Requirements: 3.1_

- [ ] 5.2 Update proxy exports
  - Change default export to named export "proxy"
  - Maintain nodejs runtime configuration
  - Preserve existing matcher configuration
  - Preserve all authentication, rate limiting, and IP whitelisting logic
  - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [ ]* 5.3 Write unit tests for proxy configuration
  - Test that src/proxy.ts exists
  - Test that src/middleware.ts does not exist
  - Test that proxy function is exported
  - Test that runtime is set to 'nodejs'
  - Test that matcher config is preserved
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [ ] 6. Phase 5: Configuration Updates
  - Update Next.js and ESLint configurations
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 6.1 Update Next.js image configuration
  - Replace images.domains with images.remotePatterns
  - Add protocol: 'https' for res.cloudinary.com
  - Add protocol: 'https' for img.clerk.com
  - Set minimumCacheTTL to 14400 (4 hours)
  - Preserve formats configuration
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 6.2 Move experimental serverActions to top level
  - Move experimental.serverActions to top-level serverActions
  - Remove experimental object if empty
  - _Requirements: 5.1_

- [ ] 6.3 Create ESLint flat config
  - Create eslint.config.js
  - Import @next/eslint-plugin-next
  - Configure recommended and core-web-vitals rules
  - Test ESLint runs without errors
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ]* 6.4 Write unit tests for configuration files
  - Test next.config.js has remotePatterns
  - Test next.config.js has no domains property
  - Test next.config.js has top-level serverActions
  - Test eslint.config.js exists and is valid
  - _Requirements: 4.1, 5.1, 6.1_

- [ ] 7. Checkpoint - Verify configurations updated
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Phase 6: Manual Async API Migration
  - Manually update files that codemod couldn't handle
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 8.1 Update client components with params
  - Update src/app/admin/users/students/[id]/page.tsx
  - Update src/app/teacher/assessments/online-exams/[id]/page.tsx
  - Update src/app/student/assessments/report-cards/[id]/page.tsx
  - Update src/app/student/assessments/exams/online/[id]/take/page.tsx
  - Update src/app/parent/performance/report-cards/[id]/page.tsx
  - Use React.use() to unwrap params Promise
  - _Requirements: 2.3_

- [ ] 8.2 Update cookies() usage
  - Update src/lib/utils/csrf.ts
  - Add await before cookies() calls
  - Update type annotations if needed
  - _Requirements: 2.5_

- [ ] 8.3 Update headers() usage
  - Update src/lib/utils/audit-log.ts
  - Update src/lib/services/auth-audit-service.ts
  - Update src/lib/actions/auth-actions.ts
  - Add await before headers() calls
  - Update type annotations if needed
  - _Requirements: 2.6_

- [ ]* 8.4 Write property test for client component params unwrapping
  - **Property 4: Client Component Params Unwrapping**
  - **Validates: Requirements 2.3**
  - Test that all client components with params use React.use()

- [ ]* 8.5 Write property test for cookies API async usage
  - **Property 6: Cookies API Async Usage**
  - **Validates: Requirements 2.5**
  - Test that all cookies() calls are awaited

- [ ]* 8.6 Write property test for headers API async usage
  - **Property 7: Headers API Async Usage**
  - **Validates: Requirements 2.6**
  - Test that all headers() calls are awaited

- [ ] 9. Phase 7: TypeScript Compilation Verification
  - Verify all TypeScript compiles without errors
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 9.1 Run TypeScript compiler
  - Execute: `npx tsc --noEmit`
  - Fix any type errors related to async APIs
  - Verify no compilation errors
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 9.2 Write property test for TypeScript compilation
  - **Property 8: TypeScript Compilation Success**
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**
  - Test that TypeScript compiles without errors

- [ ] 10. Checkpoint - Verify code migration complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Phase 8: Build Verification
  - Verify development and production builds work
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [ ] 11.1 Test development build
  - Run: `npm run dev`
  - Verify dev server starts without errors
  - Verify hot module replacement works
  - Verify pages compile on demand
  - Test accessing several routes
  - _Requirements: 12.1, 12.2, 12.3_

- [ ] 11.2 Test production build
  - Run: `npm run build`
  - Verify build completes without errors
  - Verify all pages and assets are optimized
  - Check build output for warnings
  - _Requirements: 12.4, 12.5_

- [ ] 11.3 Test production server
  - Run: `npm run start`
  - Verify production server starts
  - Test accessing several routes
  - Verify static pages are served correctly
  - _Requirements: 12.6, 12.7_

- [ ]* 11.4 Write unit tests for build process
  - Test that dev server starts successfully
  - Test that production build completes successfully
  - Test that production server starts successfully
  - _Requirements: 12.1, 12.4, 12.6_

- [ ] 12. Phase 9: Integration Testing
  - Test all major features work correctly
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 11.1, 11.2, 11.3, 11.4, 11.5, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8_

- [ ] 12.1 Test authentication flows
  - Test user login
  - Test user logout
  - Test session persistence
  - Test protected route access
  - Test unauthenticated redirects
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 12.2 Test form functionality
  - Test form rendering
  - Test form input
  - Test form validation
  - Test form submission
  - Test watch API behavior
  - Test dependent field updates
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 12.3 Test UI components
  - Test Dialog components
  - Test Select components
  - Test Popover components
  - Test keyboard navigation
  - Test screen reader compatibility
  - Check for ref warnings in console
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [ ] 12.4 Test animations
  - Test component animations
  - Test gesture handlers
  - Test layout animations
  - Test exit animations
  - Check for React 19 warnings
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 12.5 Test dynamic routes
  - Test routes with params
  - Test routes with searchParams
  - Test API routes
  - Test server actions
  - _Requirements: 13.1, 13.2, 13.3_

- [ ] 12.6 Test image optimization
  - Test external images load
  - Test image optimization works
  - Test image caching
  - _Requirements: 13.4_

- [ ] 12.7 Test middleware/proxy functionality
  - Test rate limiting works
  - Test IP whitelisting works
  - Test authentication checks work
  - _Requirements: 13.5, 13.6, 13.7_

- [ ] 12.8 Test database operations
  - Test queries work
  - Test mutations work
  - Test transactions work
  - _Requirements: 13.8_

- [ ]* 12.9 Write integration tests for critical flows
  - Test authentication flow end-to-end
  - Test form submission end-to-end
  - Test dynamic route rendering end-to-end
  - _Requirements: 8.1, 9.1, 13.1_

- [ ] 13. Phase 10: Performance Testing
  - Measure and compare performance metrics
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [ ] 13.1 Measure post-migration performance
  - Measure build time
  - Measure dev server startup time
  - Measure page load times for key routes
  - Measure Time to First Byte (TTFB)
  - Measure First Contentful Paint (FCP)
  - Measure Largest Contentful Paint (LCP)
  - Create post-migration-metrics.json
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [ ] 13.2 Compare against baseline
  - Compare build times (should be within 120% of baseline)
  - Compare startup times (should be within 120% of baseline)
  - Compare page load times (should be within 110% of baseline)
  - Compare TTFB (should be < 600ms)
  - Compare FCP (should be < 1.8s)
  - Compare LCP (should be < 2.5s)
  - Document any regressions
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [ ]* 13.3 Write property test for performance thresholds
  - **Property 9: Performance Threshold Compliance**
  - **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5, 14.6**
  - Test that performance metrics meet thresholds

- [ ] 14. Checkpoint - Verify all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Phase 11: Error Handling Verification
  - Verify error handling works correctly
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

- [ ] 15.1 Test error scenarios
  - Test API error responses
  - Test validation error messages
  - Test runtime error pages
  - Test error logging
  - Document known warnings
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

- [ ]* 15.2 Write unit tests for error handling
  - Test error pages render correctly
  - Test API errors return correct status codes
  - Test validation errors display correctly
  - _Requirements: 15.2, 15.3, 15.4_

- [ ] 16. Phase 12: Documentation and Cleanup
  - Document migration and clean up temporary files
  - _Requirements: All requirements (documentation)_

- [ ] 16.1 Create migration documentation
  - Document all changes made
  - Document any known issues or warnings
  - Document rollback procedure
  - Create MIGRATION_COMPLETE.md
  - _Requirements: 15.5_

- [ ] 16.2 Update project documentation
  - Update README.md with new versions
  - Update development setup instructions
  - Update deployment instructions if needed
  - _Requirements: All requirements_

- [ ] 16.3 Clean up temporary files
  - Remove baseline-metrics.json (or move to docs)
  - Remove affected-files.json (or move to docs)
  - Remove any migration scripts
  - Clean up any commented-out code
  - _Requirements: All requirements_

- [ ] 17. Phase 13: Staging Deployment
  - Deploy to staging and verify
  - _Requirements: All requirements_

- [ ] 17.1 Deploy to staging environment
  - Push migration branch to staging
  - Run build on staging
  - Start application on staging
  - _Requirements: All requirements_

- [ ] 17.2 Run smoke tests on staging
  - Test critical user flows
  - Test authentication
  - Test key features
  - Monitor for errors
  - _Requirements: All requirements_

- [ ] 17.3 Monitor staging metrics
  - Monitor error rates
  - Monitor performance metrics
  - Monitor user reports (if applicable)
  - Document any issues
  - _Requirements: 14.1, 14.2, 14.3, 15.6_

- [ ] 18. Final Checkpoint - Ready for production
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Phase 14: Production Deployment
  - Deploy to production with monitoring
  - _Requirements: All requirements_

- [ ] 19.1 Create rollback plan
  - Document rollback procedure
  - Prepare rollback scripts
  - Ensure backup is available
  - _Requirements: 15.1_

- [ ] 19.2 Deploy to production
  - Merge migration branch to main
  - Deploy to production environment
  - Monitor deployment process
  - _Requirements: All requirements_

- [ ] 19.3 Post-deployment monitoring
  - Monitor error rates (first hour)
  - Monitor performance metrics (first hour)
  - Monitor authentication success rates
  - Monitor form submission rates
  - Check for console errors
  - _Requirements: 14.1, 14.2, 14.3, 15.6_

- [ ] 19.4 Verify production functionality
  - Test critical user flows in production
  - Verify all features working
  - Verify no regressions
  - _Requirements: All requirements_

- [ ] 20. Migration Complete
  - Document final status and close migration
  - _Requirements: All requirements_

- [ ] 20.1 Final documentation
  - Document final metrics
  - Document any issues encountered
  - Document lessons learned
  - Create final migration report
  - _Requirements: All requirements_

- [ ] 20.2 Close migration
  - Mark migration as complete
  - Archive migration branch (or delete if merged)
  - Update project status
  - Celebrate! 🎉
  - _Requirements: All requirements_

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The migration follows a sequential, phased approach to minimize risk
- Rollback capability is maintained throughout the process
- Performance is monitored at each phase to catch regressions early

## Estimated Timeline

- Phase 1 (Preparation): 2-3 hours
- Phase 2 (Dependencies): 1-2 hours
- Phase 3-6 (Code Migration): 4-6 hours
- Phase 7-10 (Testing): 3-5 hours
- Phase 11-12 (Documentation): 1 hour
- Phase 13-14 (Deployment): 1-2 hours
- **Total: 12-19 hours**

## Success Criteria

The migration is complete when:
- ✅ All tasks marked as complete
- ✅ All tests passing
- ✅ Production deployment successful
- ✅ No critical errors in production
- ✅ Performance within acceptable thresholds
