# Marks Import Flow Diagram

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Marks Import Workflow                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Teacher    │
│  Prepares    │
│  Excel/CSV   │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 1: Upload File                                              │
│                                                                  │
│  ┌────────────┐                                                 │
│  │ Select File│──────► Validate File Type (.csv, .xlsx, .xls)  │
│  └────────────┘                                                 │
│                                                                  │
│  ┌────────────┐                                                 │
│  │ Parse File │──────► PapaParse (CSV) or xlsx (Excel)         │
│  └────────────┘                                                 │
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 2: Validate & Preview                                       │
│                                                                  │
│  ┌─────────────────┐                                            │
│  │ Validate Data   │                                            │
│  │ - Student ID    │                                            │
│  │ - Numeric marks │                                            │
│  │ - Non-negative  │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ├──► Errors Found? ──► Display Errors (Red Highlight) │
│           │                                                      │
│           └──► No Errors ──────► Show Preview Table             │
│                                                                  │
│  ┌─────────────────┐                                            │
│  │ Preview Data    │                                            │
│  │ (First 50 rows) │                                            │
│  └─────────────────┘                                            │
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 3: Import to Database                                       │
│                                                                  │
│  For each row:                                                   │
│  ┌─────────────────┐                                            │
│  │ Find Student    │──► By ID or Roll Number                    │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ├──► Not Found? ──► Add to Error List                 │
│           │                                                      │
│           └──► Found ──────► Continue                            │
│                                                                  │
│  ┌─────────────────┐                                            │
│  │ Validate Marks  │──► Against Subject Config                  │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ├──► Invalid? ──► Add to Error List                   │
│           │                                                      │
│           └──► Valid ──────► Continue                            │
│                                                                  │
│  ┌─────────────────┐                                            │
│  │ Calculate       │                                            │
│  │ - Total Marks   │                                            │
│  │ - Percentage    │                                            │
│  │ - Grade         │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ Save to DB      │──► Upsert ExamResult                       │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ Create Audit Log│──► Track Import Action                     │
│  └─────────────────┘                                            │
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 4: Display Results                                          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Import Summary                                          │   │
│  │                                                         │   │
│  │  Total Rows:      100                                  │   │
│  │  ✓ Success:       95                                   │   │
│  │  ✗ Failed:        5                                    │   │
│  │                                                         │   │
│  │  Error Details:                                        │   │
│  │  - Row 12: Student not found (Roll: 045)              │   │
│  │  - Row 23: Marks exceed maximum (Theory: 95/80)       │   │
│  │  - Row 34: Invalid marks format                       │   │
│  │  - Row 56: Student not found (ID: xyz-123)            │   │
│  │  - Row 78: Practical marks exceed maximum (95/90)     │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Component Architecture                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ MarksEntryForm Component                                         │
│                                                                  │
│  ┌────────────────┐                                             │
│  │ Select Exam    │                                             │
│  │ Select Class   │                                             │
│  │ Select Section │                                             │
│  └────────┬───────┘                                             │
│           │                                                      │
│           ▼                                                      │
│  ┌────────────────┐         ┌──────────────────┐               │
│  │ Load Students  │         │ Import from File │◄──────────┐   │
│  └────────────────┘         └────────┬─────────┘           │   │
│                                      │                      │   │
└──────────────────────────────────────┼──────────────────────┼───┘
                                       │                      │
                                       ▼                      │
┌──────────────────────────────────────────────────────────────────┐
│ ImportMarksDialog Component                                      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ State Management                                        │   │
│  │ - file: File | null                                     │   │
│  │ - parsedData: ParsedRow[]                               │   │
│  │ - validationErrors: ValidationError[]                   │   │
│  │ - step: 'upload' | 'preview' | 'result'                 │   │
│  │ - importResult: ImportResult | null                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Client-Side Functions                                   │   │
│  │                                                         │   │
│  │  parseCSV()      ──► PapaParse.parse()                 │   │
│  │  parseExcel()    ──► XLSX.read()                       │   │
│  │  validateData()  ──► Check structure & format          │   │
│  │  handleImport()  ──► Call server action                │   │
│  └────────────────────────────┬────────────────────────────┘   │
│                               │                                 │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│ Server Action: importMarksFromFile()                            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Authentication & Authorization                          │   │
│  │ - Check user session (Clerk)                            │   │
│  │ - Get database user record                              │   │
│  └────────────────────────────┬────────────────────────────┘   │
│                               │                                 │
│  ┌────────────────────────────▼────────────────────────────┐   │
│  │ Data Fetching                                           │   │
│  │ - Get exam details                                      │   │
│  │ - Get subject mark configuration                        │   │
│  └────────────────────────────┬────────────────────────────┘   │
│                               │                                 │
│  ┌────────────────────────────▼────────────────────────────┐   │
│  │ Process Each Row                                        │   │
│  │                                                         │   │
│  │  For each entry:                                        │   │
│  │  1. Find student (by ID or roll number)                │   │
│  │  2. Validate marks against config                      │   │
│  │  3. Calculate total, percentage, grade                 │   │
│  │  4. Upsert ExamResult                                  │   │
│  │  5. Create audit log                                   │   │
│  │  6. Collect errors if any                              │   │
│  └────────────────────────────┬────────────────────────────┘   │
│                               │                                 │
│  ┌────────────────────────────▼────────────────────────────┐   │
│  │ Return Result                                           │   │
│  │ - success: boolean                                      │   │
│  │ - totalRows: number                                     │   │
│  │ - successCount: number                                  │   │
│  │ - failedCount: number                                   │   │
│  │ - errors: ImportError[]                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Data Flow                                │
└─────────────────────────────────────────────────────────────────┘

Excel/CSV File
     │
     ▼
┌─────────────────┐
│ File Reader     │
│ (Browser API)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Parser          │
│ PapaParse/XLSX  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Parsed Data (Array of Objects)     │
│                                     │
│ [                                   │
│   {                                 │
│     studentId: "student-1",         │
│     rollNumber: "001",              │
│     theoryMarks: 85,                │
│     practicalMarks: 90,             │
│     internalMarks: 18,              │
│     isAbsent: false                 │
│   },                                │
│   ...                               │
│ ]                                   │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────┐
│ Client-Side     │
│ Validation      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Server Action                       │
│ importMarksFromFile()               │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────┐
│ Database        │
│ Operations      │
│                 │
│ 1. Find Student │
│ 2. Validate     │
│ 3. Calculate    │
│ 4. Upsert       │
│ 5. Audit Log    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Import Result                       │
│                                     │
│ {                                   │
│   success: true,                    │
│   totalRows: 100,                   │
│   successCount: 95,                 │
│   failedCount: 5,                   │
│   errors: [...]                     │
│ }                                   │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────┐
│ UI Update       │
│ - Show summary  │
│ - Display errors│
│ - Refresh grid  │
└─────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Error Handling                              │
└─────────────────────────────────────────────────────────────────┘

Import Process
     │
     ├──► File Upload Error
     │    ├─► Invalid file type
     │    ├─► File too large
     │    └─► File read error
     │
     ├──► Parse Error
     │    ├─► Malformed CSV
     │    ├─► Corrupted Excel
     │    └─► Missing headers
     │
     ├──► Validation Error (Client)
     │    ├─► Missing student ID/roll number
     │    ├─► Invalid marks format
     │    └─► Negative marks
     │
     ├──► Validation Error (Server)
     │    ├─► Student not found
     │    ├─► Marks exceed maximum
     │    └─► Invalid data type
     │
     └──► Database Error
          ├─► Connection error
          ├─► Transaction error
          └─► Constraint violation

Each error is:
1. Caught and logged
2. Added to error collection
3. Displayed to user with context
4. Allows partial import to continue
```

## Security Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Security Measures                           │
└─────────────────────────────────────────────────────────────────┘

Request
   │
   ▼
┌─────────────────┐
│ Authentication  │──► Clerk Session Check
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Authorization   │──► Role Check (Admin/Teacher)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Input Validation│──► Sanitize & Validate Data
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Business Logic  │──► Process Import
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Audit Logging   │──► Track All Actions
└────────┬────────┘
         │
         ▼
Response
```
