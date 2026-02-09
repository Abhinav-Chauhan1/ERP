# Alumni Portal Access Guide

## Overview

The Alumni Portal is a dedicated section of the SikshaMitra ERP platform for graduated students to stay connected with their alma mater, update their profiles, and network with fellow alumni.

## Access Requirements

### User Requirements
- Must have a user account with `STUDENT` role
- Must have an associated `Alumni` profile in the database
- Alumni profile is automatically created when a student is promoted to graduated status

### Authentication
- Alumni users authenticate using the same credentials as regular students
- After login, alumni can access the portal at `/alumni/dashboard`

## Portal Features

### 1. Dashboard (`/alumni/dashboard`)
- Welcome message with personalized greeting
- Quick statistics (total alumni, classmates, upcoming events)
- Recent school news
- Quick links to profile and directory
- Upcoming events calendar

**Requirements Covered:** 12.1, 12.5

### 2. Profile Management (`/alumni/profile`)
- Self-service profile editor
- Update current employment information
- Update contact details and address
- Add higher education details
- Manage achievements and awards
- Upload profile photo
- Set communication preferences

**Requirements Covered:** 12.2, 12.3, 12.4

### 3. Alumni Directory (`/alumni/directory`)
- Browse other alumni profiles
- Search by name or admission ID
- Filter by graduation year, class, or location
- View alumni profiles with privacy controls
- Respect individual privacy settings

**Requirements Covered:** 12.7

## Navigation

The alumni portal includes a dedicated sidebar navigation with:
- Dashboard
- My Profile
- Alumni Directory
- Events & Reunions (coming soon)
- School News (coming soon)

## Privacy Controls

### Profile Visibility
- Alumni can control who sees their information through communication preferences
- Only alumni who have opted in (`allowCommunication: true`) appear in the directory
- Contact information is shown based on individual privacy settings

### Default Privacy Settings
- Email: Visible if communication is allowed
- Phone: Private by default
- Address: Private by default
- Occupation: Public by default

## Technical Implementation

### Routes
- `/alumni` - Redirects to dashboard
- `/alumni/dashboard` - Main dashboard
- `/alumni/profile` - Profile editor
- `/alumni/directory` - Alumni directory

### Authentication Flow
1. User logs in with student credentials
2. System checks if user has STUDENT role
3. Alumni layout verifies existence of Alumni profile
4. If no alumni profile exists, redirects to `/student`
5. If alumni profile exists, grants access to alumni portal

### Middleware Configuration
The middleware has been updated to allow STUDENT role users to access `/alumni` routes:
```typescript
const studentRoutePatterns = ["/student", "/shared", "/alumni"];
```

## Future Enhancements

### Planned Features
1. **Events & Reunions**
   - View upcoming alumni events
   - RSVP to events
   - View past event photos and memories

2. **School News**
   - Read latest school updates
   - Filter by category
   - Subscribe to news notifications

3. **Career Networking**
   - Job board for alumni
   - Mentorship program
   - Professional networking features

4. **Donations & Giving**
   - Alumni donation tracking
   - Fundraising campaigns
   - Scholarship contributions

## Admin Management

Administrators can manage alumni through the admin portal:
- View all alumni profiles at `/admin/alumni`
- Edit alumni information
- Send bulk communications
- Generate alumni reports
- View alumni statistics

## Support

For issues or questions about the alumni portal:
1. Contact the school administration
2. Email: admin@school.edu
3. Check the user guide in the portal

## Related Documentation
- [Student Promotion and Alumni Management Design](../.kiro/specs/student-promotion-alumni/design.md)
- [Student Promotion and Alumni Management Requirements](../.kiro/specs/student-promotion-alumni/requirements.md)
- [Implementation Tasks](../.kiro/specs/student-promotion-alumni/tasks.md)
