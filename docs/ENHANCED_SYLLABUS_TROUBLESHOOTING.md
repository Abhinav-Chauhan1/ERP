# Enhanced Syllabus System - Troubleshooting Guide

## Table of Contents
1. [Common Issues](#common-issues)
2. [Module Management Issues](#module-management-issues)
3. [Document Upload Issues](#document-upload-issues)
4. [Progress Tracking Issues](#progress-tracking-issues)
5. [Performance Issues](#performance-issues)
6. [UI/Display Issues](#uidisplay-issues)
7. [Migration Issues](#migration-issues)
8. [Database Issues](#database-issues)
9. [Getting Help](#getting-help)

## Common Issues

### Issue: Cannot Access Syllabus Management

**Symptoms**:
- "Access Denied" or "Unauthorized" error
- Syllabus management page not visible

**Possible Causes**:
1. Insufficient permissions
2. Not logged in
3. Session expired

**Solutions**:

1. **Check your role**:
   - Only admin users can create/edit/delete content
   - Teachers can view and track progress
   - Students can only view content

2. **Verify login status**:
   - Log out and log back in
   - Clear browser cookies
   - Check if session has expired

3. **Contact administrator**:
   - Request admin permissions if needed
   - Verify your account is active

---

### Issue: Changes Not Saving

**Symptoms**:
- Click save but changes don't persist
- Page refreshes and changes are lost

**Possible Causes**:
1. Network connectivity issues
2. Validation errors
3. Session timeout
4. Browser cache issues

**Solutions**:

1. **Check network connection**:
   - Verify internet connectivity
   - Check browser console for network errors
   - Try refreshing the page

2. **Look for validation errors**:
   - Check for error messages on the form
   - Ensure all required fields are filled
   - Verify data format is correct

3. **Clear browser cache**:
   ```
   Chrome: Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
   Firefox: Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
   Safari: Cmd+Option+E (Mac)
   ```

4. **Try a different browser**:
   - Test in Chrome, Firefox, or Edge
   - Disable browser extensions temporarily

---

### Issue: Page Loading Slowly

**Symptoms**:
- Long wait times when loading syllabus
- Spinner shows for extended period
- Page becomes unresponsive

**Possible Causes**:
1. Large amount of data
2. Slow network connection
3. Server performance issues
4. Browser performance issues

**Solutions**:

1. **Check network speed**:
   - Test internet connection speed
   - Try on a different network
   - Close other bandwidth-heavy applications

2. **Reduce data load**:
   - Collapse expanded modules
   - Use pagination if available
   - Filter to specific content

3. **Clear browser cache**:
   - Clear cache and cookies
   - Restart browser
   - Try incognito/private mode

4. **Contact administrator**:
   - Report persistent performance issues
   - Provide details about when slowness occurs

## Module Management Issues

### Issue: Cannot Create Module

**Symptoms**:
- Error when clicking "Create Module"
- Form submission fails

**Possible Causes**:
1. Duplicate chapter number
2. Missing required fields
3. Invalid data format
4. Database constraints

**Solutions**:

1. **Check chapter number**:
   - Ensure chapter number is unique within the syllabus
   - Use sequential numbers (1, 2, 3, etc.)
   - Check existing modules for conflicts

2. **Verify required fields**:
   - Title: Must be provided
   - Chapter Number: Must be a positive integer
   - Order: Must be a positive integer
   - Syllabus ID: Must be valid

3. **Check error message**:
   - Read the error message carefully
   - Address the specific issue mentioned
   - Try again after fixing

**Example Error**:
```
"Chapter number 3 already exists in this syllabus"
```
**Solution**: Use a different chapter number or edit the existing module.

---

### Issue: Module Not Appearing in List

**Symptoms**:
- Created module doesn't show up
- Module list is incomplete

**Possible Causes**:
1. Page not refreshed
2. Filtering applied
3. Sorting issue
4. Cache issue

**Solutions**:

1. **Refresh the page**:
   - Press F5 or Ctrl+R (Windows) or Cmd+R (Mac)
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

2. **Check filters**:
   - Clear any active filters
   - Reset search terms
   - Check if module is in a different section

3. **Verify creation**:
   - Check if success message appeared
   - Look for the module in the database (admin only)
   - Try creating again if it failed silently

---

### Issue: Cannot Delete Module

**Symptoms**:
- Delete button doesn't work
- Error when trying to delete
- Module still appears after deletion

**Possible Causes**:
1. Insufficient permissions
2. Database constraints
3. Related data preventing deletion
4. Network error

**Solutions**:

1. **Check permissions**:
   - Verify you have admin role
   - Contact administrator if needed

2. **Understand cascade deletion**:
   - Deleting a module deletes all sub-modules and documents
   - Confirm you want to delete all related content
   - Consider archiving instead of deleting

3. **Check for errors**:
   - Look for error messages
   - Check browser console for details
   - Report persistent issues to administrator

---

### Issue: Drag-and-Drop Not Working

**Symptoms**:
- Cannot drag modules or sub-modules
- Items snap back to original position
- No visual feedback when dragging

**Possible Causes**:
1. Browser compatibility
2. JavaScript errors
3. Touch device issues
4. Conflicting browser extensions

**Solutions**:

1. **Check browser compatibility**:
   - Use latest version of Chrome, Firefox, or Edge
   - Update browser if outdated
   - Disable browser extensions temporarily

2. **Check for JavaScript errors**:
   - Open browser console (F12)
   - Look for error messages
   - Report errors to administrator

3. **Try alternative method**:
   - Use edit form to change order manually
   - Update order field directly
   - Use keyboard navigation if available

4. **For touch devices**:
   - Try long-press to initiate drag
   - Use two-finger scroll to avoid conflicts
   - Consider using desktop for complex reordering

## Document Upload Issues

### Issue: File Upload Fails

**Symptoms**:
- Upload progress stops
- Error message appears
- File doesn't appear in list

**Possible Causes**:
1. File too large (>50MB)
2. Unsupported file type
3. Network interruption
4. Storage quota exceeded

**Solutions**:

1. **Check file size**:
   - Maximum size: 50MB per file
   - Compress large files before uploading
   - Split large videos into smaller segments

2. **Verify file type**:
   - Supported documents: PDF, Word, PowerPoint
   - Supported images: JPEG, PNG, GIF, WebP
   - Supported videos: MP4, WebM, MOV
   - Rename file if extension is incorrect

3. **Compress files**:
   - Use online compression tools
   - Reduce image resolution
   - Convert videos to lower quality

4. **Try again**:
   - Retry the upload
   - Check network connection
   - Try uploading one file at a time

**Compression Tools**:
- Images: TinyPNG, Squoosh
- PDFs: SmallPDF, iLovePDF
- Videos: HandBrake, CloudConvert

---

### Issue: Bulk Upload Partially Fails

**Symptoms**:
- Some files upload, others fail
- Mixed success/failure results
- Incomplete upload summary

**Possible Causes**:
1. Individual file issues
2. Network instability
3. Mixed file types
4. Storage issues

**Solutions**:

1. **Review upload summary**:
   - Check which files failed
   - Note the error messages
   - Address issues for failed files

2. **Re-upload failed files**:
   - Upload failed files individually
   - Fix issues before re-uploading
   - Verify file integrity

3. **Check file details**:
   - Ensure all files meet requirements
   - Remove unsupported files
   - Verify file names are valid

---

### Issue: Document Not Downloading

**Symptoms**:
- Download button doesn't work
- File downloads but won't open
- Download link is broken

**Possible Causes**:
1. File deleted from storage
2. Broken file URL
3. Browser download settings
4. Network issues

**Solutions**:

1. **Check file status**:
   - Verify file still exists
   - Check if file was recently deleted
   - Contact admin if file is missing

2. **Try different browser**:
   - Test in another browser
   - Check browser download settings
   - Clear download history

3. **Check file integrity**:
   - Verify file size is correct
   - Try opening with different software
   - Re-upload if file is corrupted

4. **Copy link directly**:
   - Right-click and "Copy link address"
   - Paste in new browser tab
   - Download directly from URL

---

### Issue: Document Preview Not Working

**Symptoms**:
- Preview shows blank page
- Error when trying to view
- Preview loads indefinitely

**Possible Causes**:
1. Unsupported preview format
2. File corruption
3. Browser compatibility
4. Large file size

**Solutions**:

1. **Download instead of preview**:
   - Use download button
   - Open file locally
   - Use appropriate software

2. **Check file type**:
   - PDFs usually preview well
   - Word/PowerPoint may need download
   - Videos may require specific codecs

3. **Try different browser**:
   - Chrome has best PDF preview
   - Firefox handles most formats
   - Safari for Mac users

## Progress Tracking Issues

### Issue: Completion Checkbox Not Working

**Symptoms**:
- Clicking checkbox has no effect
- Checkbox doesn't stay checked
- Progress not updating

**Possible Causes**:
1. Insufficient permissions
2. Network error
3. JavaScript error
4. Session timeout

**Solutions**:

1. **Verify permissions**:
   - Only teachers can track progress
   - Students have read-only access
   - Check your role with administrator

2. **Check network**:
   - Verify internet connection
   - Look for error messages
   - Try refreshing the page

3. **Clear cache**:
   - Clear browser cache
   - Reload the page
   - Try in incognito mode

---

### Issue: Progress Percentage Incorrect

**Symptoms**:
- Percentage doesn't match completed items
- Progress bar shows wrong value
- Calculation seems off

**Possible Causes**:
1. Cache issue
2. Calculation error
3. Data inconsistency
4. Display bug

**Solutions**:

1. **Refresh the page**:
   - Hard refresh (Ctrl+Shift+R)
   - Clear cache and reload
   - Wait a few seconds for recalculation

2. **Verify manually**:
   - Count completed sub-modules
   - Calculate percentage: (completed / total) × 100
   - Compare with displayed value

3. **Report if persistent**:
   - Note the specific syllabus/module
   - Document the discrepancy
   - Contact administrator with details

**Example Calculation**:
```
Module has 5 sub-modules
3 are marked complete
Expected: 3/5 × 100 = 60%
If showing different value, report the issue
```

---

### Issue: Progress Not Syncing Across Devices

**Symptoms**:
- Progress shows on one device but not another
- Different completion status on mobile vs desktop
- Changes not reflecting everywhere

**Possible Causes**:
1. Cache differences
2. Not refreshed on other device
3. Different user accounts
4. Sync delay

**Solutions**:

1. **Refresh all devices**:
   - Reload page on each device
   - Clear cache on all devices
   - Wait a few seconds for sync

2. **Verify same account**:
   - Ensure logged in with same credentials
   - Check user ID matches
   - Log out and back in if needed

3. **Check timestamps**:
   - Look at "last updated" times
   - Verify changes are recent
   - Allow time for sync (usually instant)

## Performance Issues

### Issue: Slow Page Load

**Symptoms**:
- Takes long time to load syllabus
- Browser becomes unresponsive
- Timeout errors

**Possible Causes**:
1. Large syllabus with many modules
2. Many documents attached
3. Slow network
4. Server load

**Solutions**:

1. **Optimize viewing**:
   - Collapse all modules initially
   - Expand only what you need
   - Use search/filter to narrow results

2. **Improve network**:
   - Use wired connection if possible
   - Close other bandwidth-heavy apps
   - Try during off-peak hours

3. **Browser optimization**:
   - Close unnecessary tabs
   - Disable heavy extensions
   - Clear cache regularly
   - Use latest browser version

4. **Contact administrator**:
   - Report persistent slowness
   - Provide details (time, browser, actions)
   - Request performance optimization

---

### Issue: High Memory Usage

**Symptoms**:
- Browser uses lots of RAM
- Computer slows down
- Browser crashes

**Possible Causes**:
1. Too many modules expanded
2. Memory leak
3. Large documents loaded
4. Browser issue

**Solutions**:

1. **Reduce memory usage**:
   - Collapse unused modules
   - Close other browser tabs
   - Restart browser periodically
   - Use lighter browser (Edge, Firefox)

2. **Clear cache**:
   - Clear browser cache
   - Clear cookies
   - Restart browser

3. **Update browser**:
   - Install latest browser version
   - Update operating system
   - Check for browser updates

## UI/Display Issues

### Issue: Layout Broken or Misaligned

**Symptoms**:
- Elements overlapping
- Text cut off
- Buttons not visible
- Weird spacing

**Possible Causes**:
1. Browser zoom level
2. CSS not loading
3. Browser compatibility
4. Screen resolution

**Solutions**:

1. **Reset zoom**:
   - Press Ctrl+0 (Windows) or Cmd+0 (Mac)
   - Check zoom level in browser settings
   - Set to 100%

2. **Hard refresh**:
   - Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Clear cache and reload
   - Try incognito mode

3. **Check browser**:
   - Use supported browser (Chrome, Firefox, Edge)
   - Update to latest version
   - Disable extensions temporarily

4. **Adjust screen**:
   - Try different screen resolution
   - Test on different device
   - Report if issue persists

---

### Issue: Icons or Images Not Loading

**Symptoms**:
- Broken image icons
- Missing file type icons
- Placeholder images

**Possible Causes**:
1. Network issues
2. CDN problems
3. Ad blocker interference
4. Missing assets

**Solutions**:

1. **Check network**:
   - Verify internet connection
   - Refresh the page
   - Check browser console for errors

2. **Disable ad blocker**:
   - Temporarily disable ad blocker
   - Whitelist the site
   - Check if images load

3. **Clear cache**:
   - Clear browser cache
   - Reload page
   - Try different browser

---

### Issue: Mobile View Problems

**Symptoms**:
- Layout doesn't fit screen
- Buttons too small
- Can't scroll properly
- Features not accessible

**Possible Causes**:
1. Responsive design issue
2. Browser compatibility
3. Screen size limitations
4. Touch event conflicts

**Solutions**:

1. **Try different orientation**:
   - Rotate device to landscape
   - Use portrait for lists
   - Adjust as needed

2. **Use mobile browser**:
   - Chrome for Android
   - Safari for iOS
   - Update browser to latest version

3. **Zoom if needed**:
   - Pinch to zoom on small elements
   - Double-tap to zoom sections
   - Use accessibility features

4. **Report issues**:
   - Note device model and OS version
   - Describe specific problem
   - Include screenshots if possible

## Migration Issues

### Issue: Old Data Not Appearing

**Symptoms**:
- Previous units/lessons missing
- Content disappeared after migration
- Empty syllabus

**Possible Causes**:
1. Migration not run
2. Migration failed
3. Feature flag not enabled
4. Data not migrated

**Solutions**:

1. **Check migration status**:
   - Contact administrator
   - Verify migration was completed
   - Check migration logs

2. **Verify feature flag**:
   - Ensure enhanced syllabus is enabled
   - Check school settings
   - Toggle feature flag if needed

3. **Check old structure**:
   - Temporarily disable feature flag
   - Verify old data still exists
   - Re-run migration if needed

---

### Issue: Duplicate Content After Migration

**Symptoms**:
- Same content appears twice
- Duplicate modules
- Redundant sub-modules

**Possible Causes**:
1. Migration run multiple times
2. Manual content creation
3. Data inconsistency

**Solutions**:

1. **Identify duplicates**:
   - Compare creation dates
   - Check for identical content
   - Note which are duplicates

2. **Remove duplicates**:
   - Delete newer duplicates
   - Keep original content
   - Verify relationships are correct

3. **Contact administrator**:
   - Report duplication issue
   - Request cleanup if needed
   - Prevent future duplications

## Database Issues

### Issue: "Record Not Found" Errors

**Symptoms**:
- Error when accessing content
- "Module not found" message
- "Sub-module not found" message

**Possible Causes**:
1. Content was deleted
2. Database inconsistency
3. Broken relationships
4. Cache issue

**Solutions**:

1. **Refresh the page**:
   - Hard refresh
   - Clear cache
   - Try again

2. **Verify content exists**:
   - Check if content was deleted
   - Look in other sections
   - Contact administrator

3. **Report to administrator**:
   - Provide error message
   - Note which content is affected
   - Include steps to reproduce

---

### Issue: Constraint Violation Errors

**Symptoms**:
- "Unique constraint violation"
- "Foreign key constraint failed"
- Database error messages

**Possible Causes**:
1. Duplicate data
2. Invalid relationships
3. Database integrity issue

**Solutions**:

1. **Check for duplicates**:
   - Verify chapter numbers are unique
   - Check for duplicate titles
   - Use different values

2. **Verify relationships**:
   - Ensure parent exists
   - Check foreign key references
   - Contact administrator if needed

3. **Report persistent errors**:
   - Document error message
   - Note what action caused it
   - Contact technical support

## Getting Help

### Before Contacting Support

1. **Try basic troubleshooting**:
   - Refresh the page
   - Clear cache
   - Try different browser
   - Check network connection

2. **Gather information**:
   - Error messages (exact text)
   - Steps to reproduce
   - Browser and version
   - Operating system
   - Screenshots if applicable

3. **Check documentation**:
   - Review user guides
   - Check API reference
   - Read migration guide

### Contacting Support

**Include this information**:
- Your role (admin, teacher, student)
- What you were trying to do
- What happened instead
- Error messages
- Browser and OS
- Screenshots or screen recording

**Contact Methods**:
1. School administrator (first contact)
2. Technical support email
3. Help desk ticket system
4. Emergency hotline (critical issues only)

### Reporting Bugs

**Good bug report includes**:
1. **Title**: Brief description
2. **Description**: Detailed explanation
3. **Steps to reproduce**: Numbered list
4. **Expected behavior**: What should happen
5. **Actual behavior**: What actually happens
6. **Environment**: Browser, OS, version
7. **Screenshots**: Visual evidence
8. **Frequency**: Always, sometimes, once

**Example Bug Report**:
```
Title: Cannot upload PDF files larger than 10MB

Description: When attempting to upload PDF files larger than 10MB,
the upload fails with an error message.

Steps to Reproduce:
1. Navigate to module management
2. Click "Upload Document"
3. Select a PDF file larger than 10MB
4. Click "Upload"

Expected: File should upload successfully (limit is 50MB)
Actual: Error message "Upload failed" appears

Environment:
- Browser: Chrome 120.0.6099.109
- OS: Windows 11
- File size: 15MB
- File type: PDF

Screenshot: [attached]

Frequency: Always happens with files >10MB
```

---

**Last Updated**: December 2024  
**Version**: 1.0
