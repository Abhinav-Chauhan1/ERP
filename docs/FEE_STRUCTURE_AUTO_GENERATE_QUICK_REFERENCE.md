# Fee Structure Auto-Generate - Quick Reference

## Quick Start

### Access the Feature
1. Go to **Admin** → **Finance** → **Fee Structure**
2. Click on the **Fee Types** tab
3. Click the **Auto-Generate** button (with sparkles icon ✨)

## Standard Fee Types Available

| Fee Type | Amount | Frequency | Optional | Description |
|----------|--------|-----------|----------|-------------|
| Tuition Fee | ₹10,000 | Annual | No | Regular tuition charges |
| Admission Fee | ₹5,000 | One Time | No | One-time admission charges |
| Development Fee | ₹3,000 | Annual | No | Infrastructure development |
| Examination Fee | ₹1,500 | Annual | No | Examination charges |
| Library Fee | ₹1,000 | Annual | No | Library access charges |
| Laboratory Fee | ₹2,000 | Annual | No | Lab usage charges |
| Sports Fee | ₹1,500 | Annual | Yes | Sports facilities |
| Transport Fee | ₹12,000 | Annual | Yes | School bus charges |
| Hostel Fee | ₹50,000 | Annual | Yes | Boarding charges |
| Computer Fee | ₹2,000 | Annual | No | IT infrastructure |
| Activity Fee | ₹1,000 | Annual | Yes | Co-curricular activities |
| Uniform Fee | ₹3,000 | Annual | Yes | School uniform |
| Stationery Fee | ₹2,000 | Annual | Yes | Books and stationery |
| Medical Fee | ₹500 | Annual | Yes | Health checkup |
| Security Deposit | ₹5,000 | One Time | No | Refundable deposit |

## How to Use

### Generate All Fee Types
1. Click **Auto-Generate** button
2. Click **Select All**
3. Click **Generate Fee Types**
4. Done! All 15 fee types are created

### Generate Specific Fee Types
1. Click **Auto-Generate** button
2. Check the boxes for fee types you want
3. Click **Generate X Fee Types** (X = number selected)
4. Selected fee types are created

### What Happens
- ✅ Only creates fee types that don't exist
- ✅ Skips duplicates automatically
- ✅ Shows success message with count
- ✅ Refreshes the list immediately
- ✅ Fee types are ready to use in fee structures

## Dialog Features

### Selection Controls
- **Select All**: Checks all available fee types
- **Deselect All**: Unchecks all fee types
- **Individual Checkboxes**: Click any fee type to toggle

### Visual Indicators
- **Frequency Badge**: Shows payment frequency
- **Optional Badge**: Indicates if fee is optional
- **Selected Count**: Shows how many are selected
- **Default Amount**: Displays the preset amount

### Smart Behavior
- Only shows fee types that don't exist yet
- If all exist, shows success message
- Can't generate without selecting at least one
- Loading spinner during generation

## After Generation

### What You Can Do
1. **Edit Amounts**: Customize default amounts
2. **Set Class-Specific Amounts**: Different amounts per class
3. **Use in Fee Structures**: Add to fee structures immediately
4. **Modify Details**: Change description, frequency, etc.

### Best Practices
1. Generate all standard fee types first
2. Customize amounts based on your school
3. Set class-specific amounts if needed
4. Create fee structures using these types

## Customization

### Editing Generated Fee Types
1. Go to Fee Types tab
2. Click **Edit** button on any fee type
3. Modify:
   - Name
   - Description
   - Default amount
   - Frequency
   - Optional status
   - Class-specific amounts

### Adding Custom Fee Types
- Use **Create Fee Type** button for custom fees
- Auto-generate is only for standard types
- You can have both standard and custom types

## Tips

### For New Schools
- Generate all 15 standard fee types
- Customize amounts to match your fee structure
- Set class-specific amounts if fees vary by grade

### For Existing Schools
- Generate only missing fee types
- Keep your existing custom fee types
- No duplicates will be created

### For Multiple Branches
- Generate once per school/branch
- Amounts can be different per branch
- Each branch has independent fee types

## Troubleshooting

### "No new fee types to create"
- All selected fee types already exist
- Try selecting different ones
- Or create custom fee types manually

### "All Standard Fee Types Exist"
- You've already generated all standard types
- Use "Create Fee Type" for custom types
- Edit existing types if needed

### Fee Type Not Appearing
- Check if it was already created
- Refresh the page
- Check the Fee Types tab

## Technical Notes

### Database
- Uses `FeeType` model
- Batch creation with `createMany`
- Duplicate prevention built-in

### Validation
- Case-insensitive duplicate checking
- Required fields validated
- Amount must be positive

### Performance
- Efficient batch operations
- Minimal database queries
- Instant UI updates

## Related Features

### Fee Structures
- Use generated fee types in structures
- Combine multiple fee types
- Set due dates per fee type

### Class-Specific Amounts
- Different amounts per class
- Override default amounts
- Flexible pricing

### Analytics
- Track fee type usage
- Revenue projections
- Payment analysis

## Support

For issues or questions:
1. Check existing fee types first
2. Verify amounts are correct
3. Test with one fee type first
4. Contact system administrator if needed
