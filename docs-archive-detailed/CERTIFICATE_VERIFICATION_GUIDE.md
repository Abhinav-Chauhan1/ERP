# Certificate Verification Portal Guide

## Overview

The Certificate Verification Portal allows anyone to verify the authenticity of certificates issued by the institution. This is a public-facing feature that doesn't require authentication.

## Features

### 1. Public Verification Page
- **URL**: `/verify-certificate`
- **Purpose**: Entry point for certificate verification
- **Features**:
  - Clean, professional interface
  - Simple form to enter verification code
  - Instructions on how to verify
  - Help section with contact information

### 2. Verification Result Page
- **URL**: `/verify-certificate/[code]`
- **Purpose**: Display verification results
- **Features**:
  - Success/failure alerts
  - Detailed certificate information
  - Certificate status (Active, Revoked, Expired)
  - Student name and certificate details
  - Issue date and verification status

## How to Use

### For Certificate Holders

1. Navigate to `/verify-certificate`
2. Enter the verification code from your certificate
   - The code is typically found at the bottom of the certificate
   - It's also embedded in the QR code on the certificate
3. Click "Verify Certificate"
4. View the verification results

### For Administrators

Certificates are automatically assigned verification codes when generated through the bulk certificate generation system. The verification codes are:
- Unique for each certificate
- Embedded in QR codes on certificates
- Stored securely in the database

## Technical Implementation

### Components

1. **Main Verification Page** (`src/app/verify-certificate/page.tsx`)
   - Public landing page
   - Verification form
   - Information cards
   - Help section

2. **Verification Form** (`src/components/certificate-verification-form.tsx`)
   - Client component for form handling
   - Input validation
   - Navigation to result page

3. **Result Page** (`src/app/verify-certificate/[code]/page.tsx`)
   - Dynamic route for verification results
   - Server-side verification
   - Detailed certificate display
   - Status indicators

### API Integration

The verification portal uses the existing certificate generation actions:
- `verifyCertificateByCode(code)` - Verifies a certificate by its verification code

### Database Schema

The verification system uses the following models:
- `GeneratedCertificate` - Stores generated certificates with verification codes
- `CertificateTemplate` - Stores certificate templates

## Security Considerations

1. **Public Access**: The verification portal is intentionally public and doesn't require authentication
2. **Rate Limiting**: Consider implementing rate limiting to prevent abuse
3. **Verification Codes**: Codes are unique and cryptographically secure
4. **Status Tracking**: Certificates can be revoked if needed

## Validation Requirements

According to **Requirement 12.5**, the verification portal must:
- ✅ Create public verification page
- ✅ Allow verification using certificate number
- ✅ Display certificate details if valid
- ✅ Show error if certificate not found

## Testing

### Manual Testing

1. Generate a certificate through the admin panel
2. Note the verification code
3. Navigate to `/verify-certificate`
4. Enter the verification code
5. Verify the certificate details are displayed correctly

### Test Cases

1. **Valid Certificate**
   - Enter a valid verification code
   - Should display certificate details
   - Should show "Verified Successfully" message

2. **Invalid Certificate**
   - Enter an invalid verification code
   - Should display "Certificate Not Found" error
   - Should provide helpful error messages

3. **Revoked Certificate**
   - Enter a revoked certificate's verification code
   - Should display "Certificate Revoked" warning
   - Should still show certificate details

## Future Enhancements

1. **QR Code Scanning**: Add ability to scan QR codes directly from the browser
2. **Certificate Download**: Allow downloading verified certificates
3. **Verification History**: Track verification attempts (with privacy considerations)
4. **Multi-language Support**: Support multiple languages for international users
5. **API Endpoint**: Provide a REST API for programmatic verification

## Support

For issues or questions about certificate verification:
- Email: admin@school.edu
- Phone: +1 (234) 567-890

## Related Documentation

- [Certificate Generation Guide](./CERTIFICATE_GENERATION_GUIDE.md)
- [Certificate Template Guide](./CERTIFICATE_TEMPLATE_GUIDE.md)
- [Admin Certificate Management](./ADMIN_CERTIFICATE_MANAGEMENT.md)
