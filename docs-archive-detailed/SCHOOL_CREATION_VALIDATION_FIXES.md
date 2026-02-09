# School Creation Validation Fixes

## Issues Identified

From the error logs, three main validation issues were identified in the school creation API:

1. **Empty subdomain field** - The subdomain field was required but empty when subdomain was disabled
2. **Invalid subdomain format** - The subdomain validation was not properly handling empty strings
3. **Invalid subscription plan enum** - The system was receiving plan IDs instead of expected enum values

## Fixes Applied

### 1. Subdomain Validation Fix

**Problem**: The original schema used complex optional/literal validation that didn't properly handle the case where subdomain is enabled but empty.

**Solution**: Replaced with a `refine()` validation that:
- Allows optional subdomain field
- Uses custom validation logic to check if subdomain is required when `enableSubdomain` is true
- Validates subdomain format only when provided
- Transforms empty subdomain to `undefined` when subdomain is disabled

```typescript
// Before
subdomain: z.string().min(1).regex(/^[a-z0-9-]+$/, "...").optional().or(z.literal(""))

// After
subdomain: z.string().optional(),
// ... with refine() validation
.refine((data) => {
  if (data.enableSubdomain) {
    if (!data.subdomain || data.subdomain.trim() === '') {
      return false;
    }
    return /^[a-z0-9-]+$/.test(data.subdomain);
  }
  return true;
}, {
  message: "Subdomain is required when enabled and must contain only lowercase letters, numbers, and hyphens",
  path: ["subdomain"]
})
```

### 2. Subscription Plan Validation Fix

**Problem**: The schema expected enum values like 'STARTER', 'GROWTH', 'DOMINATE', but the form was sending database plan IDs.

**Solution**: 
- Changed schema to accept any non-empty string for `subscriptionPlan`
- Added database validation to fetch and validate the plan exists and is active
- Store plan details in school metadata for reference

```typescript
// Before
subscriptionPlan: z.enum(['STARTER', 'GROWTH', 'DOMINATE'])

// After
subscriptionPlan: z.string().min(1, "Subscription plan is required")

// Added database validation
const subscriptionPlan = await db.subscriptionPlan.findUnique({
  where: { id: validatedData.subscriptionPlan }
});

if (!subscriptionPlan || !subscriptionPlan.isActive) {
  return NextResponse.json({ error: 'Invalid or inactive subscription plan' }, { status: 400 });
}
```

### 3. Form Data Handling Fix

**Problem**: The form was sending inconsistent data for disabled subdomain.

**Solution**: Updated form submission to ensure proper data formatting:

```typescript
const submitData = {
  ...formData,
  // Ensure subdomain is empty string when disabled, not undefined
  subdomain: formData.enableSubdomain ? formData.subdomain : "",
};
```

### 4. School Creation Enhancement

**Problem**: The school creation logic wasn't properly handling plan metadata.

**Solution**: Enhanced school creation to:
- Store complete plan information in school metadata
- Convert plan name to enum-like format for backward compatibility
- Include plan features and pricing information

```typescript
const schoolData = {
  // ... other fields
  plan: subscriptionPlan.name.toUpperCase().replace(/\s+/g, '_'),
  metadata: {
    subscriptionPlanId: subscriptionPlan.id,
    subscriptionPlanName: subscriptionPlan.name,
    planAmount: subscriptionPlan.amount,
    planInterval: subscriptionPlan.interval,
    planFeatures: subscriptionPlan.features,
    // ... other metadata
  },
};
```

## Validation Test Results

All validation scenarios now pass correctly:

✅ **Subdomain enabled but empty** - Correctly fails validation  
✅ **Subdomain disabled with empty subdomain** - Passes validation  
✅ **Valid subdomain** - Passes validation  
✅ **Invalid subdomain format** - Correctly fails validation  
✅ **Plan ID validation** - Passes with any valid string  
✅ **Empty plan ID** - Correctly fails validation  

## Impact

These fixes resolve the school creation validation errors and ensure:

1. **Proper subdomain handling** - Subdomains are only required when enabled
2. **Flexible plan selection** - Any active plan from the database can be selected
3. **Better error messages** - Clear validation feedback for users
4. **Data consistency** - Proper transformation and storage of form data

## Files Modified

- `src/app/api/super-admin/schools/route.ts` - Main API route with validation fixes
- `src/components/super-admin/schools/school-creation-form.tsx` - Form data handling
- Added comprehensive validation testing

The school creation functionality should now work correctly without validation errors.