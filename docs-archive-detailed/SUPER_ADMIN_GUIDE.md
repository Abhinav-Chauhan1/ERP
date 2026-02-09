# Super Admin Guide - SikshaMitra ERP

## Overview

This guide provides comprehensive instructions for super administrators to effectively manage the SikshaMitra ERP system, including schools, users, billing, and system monitoring.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [School Management](#school-management)
4. [User Management](#user-management)
5. [Billing & Subscriptions](#billing--subscriptions)
6. [System Monitoring](#system-monitoring)
7. [Security & Permissions](#security--permissions)
8. [Backup & Data Management](#backup--data-management)
9. [Analytics & Reporting](#analytics--reporting)
10. [Support & Troubleshooting](#support--troubleshooting)

## Getting Started

### Accessing the Super Admin Panel

1. Navigate to your SikshaMitra ERP domain
2. Click on "Super Admin Login" or go to `/super-admin/login`
3. Enter your super admin credentials
4. You'll be redirected to the super admin dashboard

### Initial Setup

After first login, ensure you:
- [ ] Review system health status
- [ ] Configure global settings
- [ ] Set up notification preferences
- [ ] Review security settings

## Dashboard Overview

The super admin dashboard provides a comprehensive view of your entire system:

### Key Metrics
- **Total Schools**: Active, inactive, and suspended schools
- **Total Users**: Breakdown by role (students, teachers, parents, admins)
- **System Health**: Database, cache, and service status
- **Revenue Metrics**: Monthly recurring revenue, churn rate
- **Usage Statistics**: API calls, storage usage, bandwidth

### Quick Actions
- Create new school
- View recent activities
- Check system alerts
- Access support tickets

## School Management

### Creating a New School

1. Navigate to **Schools** → **Create School**
2. Fill in basic information:
   - School name and code
   - Contact details (phone, email, address)
   - Subdomain preference
3. Select subscription plan (STARTER, GROWTH, DOMINATE)
4. Configure initial settings:
   - Academic year
   - Time zone
   - Language preferences
5. Click **Create School**

### Managing Existing Schools

#### School Overview
- View school details and statistics
- Monitor user activity and engagement
- Check subscription status and usage

#### School Settings
Access comprehensive settings for each school:

**Permissions Management**
- User management permissions
- Academic feature access
- Communication tools
- Financial operations
- Advanced features

**Security Settings**
- Two-factor authentication
- Password policies
- IP whitelisting
- Session management
- Audit logging

**Data Management**
- Backup configuration
- Export permissions
- Data retention policies
- Storage management

**Notification Settings**
- Email notifications
- SMS integration
- WhatsApp messaging
- Push notifications
- Timing controls

### School Actions

**Suspend School**
1. Go to school details page
2. Click **Actions** → **Suspend**
3. Provide reason for suspension
4. Confirm action

**Reactivate School**
1. Find suspended school
2. Click **Actions** → **Reactivate**
3. Confirm reactivation

**Delete School** (Use with extreme caution)
1. Ensure all data is backed up
2. Go to school settings
3. Click **Danger Zone** → **Delete School**
4. Type school name to confirm
5. Confirm deletion

## User Management

### User Overview
- View all users across all schools
- Filter by role, school, status
- Search by name, email, or phone

### User Actions

**Create User**
1. Navigate to **Users** → **Create User**
2. Select user type (Student, Teacher, Parent, Admin)
3. Fill in personal information
4. Assign to school(s)
5. Set permissions and roles
6. Send invitation email

**Manage User**
- Edit user details
- Change user status (active/inactive)
- Reset password
- Manage school associations
- View user activity logs

**Bulk Operations**
- Import users from CSV
- Export user data
- Bulk status changes
- Mass communication

## Billing & Subscriptions

### Subscription Management

**View Subscriptions**
- Active subscriptions by school
- Payment history and status
- Usage vs. plan limits
- Upcoming renewals

**Plan Changes**
1. Go to school billing page
2. Click **Change Plan**
3. Select new plan
4. Review pricing changes
5. Confirm upgrade/downgrade

**Payment Issues**
- View failed payments
- Retry payment processing
- Update payment methods
- Send payment reminders

### Revenue Analytics
- Monthly recurring revenue (MRR)
- Customer lifetime value (CLV)
- Churn rate and retention
- Revenue by plan type

## System Monitoring

### Health Checks
Monitor system components:
- **Database**: Connection status, query performance
- **Cache**: Hit rates, memory usage
- **Storage**: Disk usage, backup status
- **External Services**: Email, SMS, payment gateways

### Performance Metrics
- API response times
- Error rates
- Concurrent users
- Resource utilization

### Alerts & Notifications
Configure alerts for:
- System downtime
- High error rates
- Resource exhaustion
- Security incidents

## Security & Permissions

### Global Security Settings
- Rate limiting configuration
- IP whitelisting rules
- Session timeout policies
- Password complexity requirements

### Audit Logging
- View all system activities
- Filter by user, action, resource
- Export audit logs
- Set retention policies

### Emergency Access
- Disable user accounts
- Suspend schools immediately
- Override security restrictions
- Emergency contact procedures

## Backup & Data Management

### Backup Management

**Automated Backups**
- Configure backup schedules
- Set retention policies
- Monitor backup status
- Verify backup integrity

**Manual Backups**
1. Go to school data management
2. Click **Create Backup**
3. Select backup options:
   - Include files
   - Include database
   - Include logs
   - Compression level
4. Start backup process

**Restore Operations**
1. Select backup to restore
2. Choose restore options
3. Confirm restore operation
4. Monitor restore progress

### Data Export
- Export school data in various formats (CSV, JSON, PDF, XLSX)
- Configure export permissions
- Schedule automated exports
- Manage export approvals

## Analytics & Reporting

### Usage Analytics
- User engagement metrics
- Feature adoption rates
- Geographic distribution
- Device and browser statistics

### Custom Reports
- Create custom dashboards
- Schedule automated reports
- Export data for analysis
- Share reports with stakeholders

### Business Intelligence
- Revenue forecasting
- Churn prediction
- Growth trend analysis
- Comparative performance metrics

## Support & Troubleshooting

### Support Ticket Management
- View all support tickets
- Assign tickets to team members
- Track resolution times
- Manage knowledge base

### Common Issues

**School Login Problems**
1. Check school status (active/suspended)
2. Verify user permissions
3. Check authentication logs
4. Reset user password if needed

**Performance Issues**
1. Check system health dashboard
2. Review error logs
3. Monitor resource usage
4. Clear cache if necessary

**Billing Issues**
1. Verify payment method
2. Check subscription status
3. Review usage limits
4. Contact payment provider if needed

### Emergency Procedures

**System Outage**
1. Check health dashboard
2. Review error logs
3. Restart affected services
4. Notify affected schools
5. Document incident

**Security Incident**
1. Identify affected accounts
2. Suspend compromised users
3. Change system passwords
4. Review audit logs
5. Implement additional security measures

## Best Practices

### Daily Tasks
- [ ] Review system health dashboard
- [ ] Check for critical alerts
- [ ] Monitor support tickets
- [ ] Review failed payments

### Weekly Tasks
- [ ] Analyze usage trends
- [ ] Review security logs
- [ ] Check backup status
- [ ] Update system documentation

### Monthly Tasks
- [ ] Generate revenue reports
- [ ] Review user feedback
- [ ] Plan system updates
- [ ] Conduct security review

## API Access

### Authentication
All API requests require authentication:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://api.sikshamitra.com/api/super-admin/schools
```

### Common API Endpoints
- `GET /api/super-admin/schools` - List all schools
- `POST /api/super-admin/schools` - Create new school
- `GET /api/super-admin/users` - List all users
- `GET /api/super-admin/analytics/dashboard` - Get dashboard data

### API Documentation
Access comprehensive API documentation at:
- Swagger UI: `/api/super-admin/system/docs?format=html`
- OpenAPI Spec: `/api/super-admin/system/docs?format=openapi`
- Markdown: `/api/super-admin/system/docs?format=markdown`

## Contact & Support

For technical support or questions about this guide:
- Email: support@sikshamitra.com
- Documentation: [docs.sikshamitra.com](https://docs.sikshamitra.com)
- Status Page: [status.sikshamitra.com](https://status.sikshamitra.com)

---

**Last Updated**: January 28, 2026  
**Version**: 1.0.0  
**Applies to**: SikshaMitra ERP v2.0+