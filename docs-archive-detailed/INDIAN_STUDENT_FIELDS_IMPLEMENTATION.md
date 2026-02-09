# Indian Student Fields Implementation

## Overview
Added comprehensive Indian-specific fields to both Student and AdmissionApplication models to support Indian educational requirements.

## Changes Made

### 1. Database Schema Updates

#### Student Model
Added the following fields:
- **Identity Documents**:
  - `aadhaarNumber` - 12-digit Aadhaar card number
  - `abcId` - Academic Bank of Credits ID
  
- **Personal Details**:
  - `nationality` - Default: "Indian"
  - `religion` - Student's religion
  - `caste` - Student's caste
  - `category` - Reservation category (General, OBC, SC, ST, EWS)
  - `motherTongue` - Student's mother tongue
  - `birthPlace` - Place of birth
  - `previousSchool` - Previous school name
  - `previousClass` - Previous class/grade
  - `tcNumber` - Transfer Certificate number
  - `medicalConditions` - Medical conditions/allergies
  - `specialNeeds` - Special educational needs

- **Parent/Guardian Details**:
  - Father: name, occupation, phone, email, Aadhaar
  - Mother: name, occupation, phone, email, Aadhaar
  - Guardian: name, relation, phone, email, Aadhaar

#### AdmissionApplication Model
Added identical fields as Student model plus:
- `annualIncome` - Annual family income for scholarship/fee concession purposes

### 2. Schema Validation
Updated `admissionSchemaValidation.ts` with:
- Aadhaar number validation (12 digits)
- Category enum validation
- Optional email validations for parents
- All Indian-specific fields as optional

### 3. Server Actions
Updated `createAdmissionApplication` to handle all new fields when creating admission applications.

### 4. Admission Form
Created comprehensive admission form with sections:
1. **Student Information** - All personal and identity details
2. **Primary Contact Information** - Main contact person
3. **Father Details** - Complete father information
4. **Mother Details** - Complete mother information
5. **Guardian Details** - Optional guardian information
6. **Financial Information** - Annual income

### 5. Database Migration
Created and applied migration: `add_indian_student_fields`
- Added all new columns to both tables
- Created indexes on Aadhaar and ABC ID for faster lookups
- All fields are nullable to maintain backward compatibility

## Field Descriptions

### Aadhaar Number
- 12-digit unique identification number issued by UIDAI
- Used for identity verification
- Indexed for quick lookups

### ABC ID (Academic Bank of Credits)
- Unique ID for storing academic credits
- Part of National Education Policy 2020
- Allows credit transfer between institutions

### Category
- **GENERAL** - General category
- **OBC** - Other Backward Classes
- **SC** - Scheduled Caste
- **ST** - Scheduled Tribe
- **EWS** - Economically Weaker Section

### TC Number
- Transfer Certificate number from previous school
- Required for admission verification

## Usage

### Creating Admission Application
```typescript
const result = await createAdmissionApplication({
  // Required fields
  studentName: "John Doe",
  dateOfBirth: new Date("2010-01-01"),
  gender: "MALE",
  parentName: "Jane Doe",
  parentEmail: "jane@example.com",
  parentPhone: "9876543210",
  address: "123 Main St",
  appliedClassId: "class-id",
  
  // Indian-specific fields
  aadhaarNumber: "123456789012",
  abcId: "ABC123456",
  category: "GENERAL",
  nationality: "Indian",
  religion: "Hindu",
  motherTongue: "Hindi",
  
  // Parent details
  fatherName: "John Doe Sr.",
  fatherAadhaar: "987654321098",
  motherName: "Jane Doe",
  motherAadhaar: "876543210987",
  
  annualIncome: 500000,
});
```

## Benefits

1. **Compliance** - Meets Indian educational documentation requirements
2. **Scholarship Management** - Category and income data for fee concessions
3. **Identity Verification** - Aadhaar integration for verification
4. **Complete Records** - Comprehensive parent/guardian information
5. **NEP 2020 Ready** - ABC ID support for credit transfer
6. **Backward Compatible** - All new fields are optional

## Future Enhancements

1. Aadhaar verification API integration
2. ABC ID validation with DIGILOCKER
3. Automatic category certificate verification
4. Income certificate upload and verification
5. TC verification with previous school
6. Caste certificate validation

## Notes

- All new fields are optional to maintain backward compatibility
- Aadhaar numbers are stored as strings (not encrypted in this version)
- Consider adding encryption for sensitive data like Aadhaar in production
- Add proper access controls for viewing sensitive information
