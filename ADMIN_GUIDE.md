# 🔧 Admin Guide - Exam Paper Management

This guide explains how to use the admin tools to manage GCSE and A-Level exam questions in your Mentara Tutor application.

## 🚀 Quick Access

Navigate to `/admin` to access the main admin dashboard with all available tools.

## 📚 Available Admin Tools

### 1. **Manage Exam Papers** (`/admin/manage-exam-papers`)
- **Purpose**: Add, edit, and manage individual exam questions
- **Best for**: Adding a few questions manually or making quick edits
- **Features**:
  - Add new questions with full metadata
  - Edit existing questions
  - Delete questions
  - Search and filter questions
  - Export questions to JSON
  - View statistics and counts

### 2. **Bulk Import Questions** (`/admin/bulk-import-questions`)
- **Purpose**: Import multiple questions at once from external sources
- **Best for**: Adding many questions from CSV files, JSON data, or manual bulk entry
- **Features**:
  - CSV import with templates
  - JSON import with validation
  - Manual bulk entry forms
  - Validation and error reporting
  - Export to CSV
  - Batch processing

### 3. **Import Exam Papers** (`/admin/import-exam-papers`)
- **Purpose**: Sync static exam paper data with Firestore database
- **Best for**: Initial setup or updating the database with new exam papers
- **Features**:
  - Bulk import from static TypeScript files
  - Clear existing data before import
  - View current Firestore status
  - One-click synchronization

### 4. **Debug Firestore** (`/debug-firestore`)
- **Purpose**: Inspect and verify data in Firestore
- **Best for**: Troubleshooting data issues or verifying imports
- **Features**:
  - View all exam papers in Firestore
  - Check specific exam paper details
  - Clear and reimport data
  - Verify question counts

### 5. **Test Detection** (`/test-detection`)
- **Purpose**: Test the exam question detection logic
- **Best for**: Debugging detection accuracy or testing new questions
- **Features**:
  - Test individual questions
  - View detection logs
  - Check database matches
  - Validate detection logic

## 📊 Adding Questions Manually

### Step-by-Step Process:

1. **Navigate to** `/admin/manage-exam-papers`
2. **Click** "Add New Question"
3. **Fill in the form**:
   - **Question Text** * (required): The full question text
   - **Exam Board** * (required): AQA, Edexcel, OCR, etc.
   - **Year** * (required): Exam year (2000-2030)
   - **Paper**: Paper identifier (e.g., "Paper 1H", "Paper 2F")
   - **Question Number**: Question number (e.g., "1", "2a", "3b")
   - **Category**: General category (e.g., "Algebra", "Geometry")
   - **Marks**: Number of marks (1-20)
   - **Difficulty**: Foundation, Higher, or Mixed
   - **Topic**: Specific topic (e.g., "Linear Equations", "Area and Perimeter")

4. **Click** "Add Question"

### Example Question:
```
Question: "Solve the equation 3x + 7 = 22"
Exam Board: AQA
Year: 2023
Paper: Paper 1H
Question Number: 1
Category: Algebra
Marks: 2
Difficulty: Foundation
Topic: Linear Equations
```

## 📥 Bulk Import from External Sources

### CSV Import:

1. **Navigate to** `/admin/bulk-import-questions`
2. **Click** "Get Template" to see the required format
3. **Prepare your CSV** with these columns:
   ```
   Question,Exam Board,Year,Paper,Question Number,Category,Marks,Difficulty,Topic
   "Solve 3x + 7 = 22",AQA,2023,Paper 1H,1,Algebra,2,Foundation,Linear Equations
   ```
4. **Paste CSV data** into the text area
5. **Click** "Import CSV"
6. **Review** the imported questions
7. **Click** "Process Import"

### JSON Import:

1. **Click** "Get Template" to see the JSON structure
2. **Prepare your JSON** array of question objects:
   ```json
   [
     {
       "question": "Solve the equation 3x + 7 = 22",
       "examBoard": "AQA",
       "year": 2023,
       "paper": "Paper 1H",
       "questionNumber": "1",
       "category": "Algebra",
       "marks": 2,
       "difficulty": "Foundation",
       "topic": "Linear Equations"
     }
   ]
   ```
3. **Paste JSON data** into the text area
4. **Click** "Import JSON"
5. **Review** and process the import

### Manual Bulk Entry:

1. **Click** "Add Empty Question" for each question you want to add
2. **Fill in** each question form
3. **Use** the grid layout for efficient data entry
4. **Click** "Process Import" when done

## 🔄 Syncing with Firestore

### Initial Setup:

1. **Navigate to** `/admin/import-exam-papers`
2. **Check** if data exists in Firestore
3. **Click** "Start Import" if no data exists
4. **Wait** for the import to complete
5. **Verify** the imported data

### Updating Data:

1. **Navigate to** `/debug-firestore`
2. **Click** "Check Firestore Data"
3. **Review** the current data
4. **Click** "Clear & Reimport" if needed
5. **Verify** the updated data

## 🧪 Testing and Debugging

### Testing Question Detection:

1. **Navigate to** `/test-detection`
2. **Enter** a question text to test
3. **Click** "Test Detection"
4. **Review** the console logs
5. **Check** if the question matches in the database

### Debugging Firestore:

1. **Navigate to** `/debug-firestore`
2. **Click** "Check Firestore Data"
3. **Review** the data structure
4. **Check** question counts and metadata
5. **Use** "Clear & Reimport" if data is corrupted

## 📋 Best Practices

### Question Organization:

- **Use consistent naming** for exam boards and papers
- **Group questions by topic** for better organization
- **Use descriptive topics** (e.g., "Linear Equations" not just "Algebra")
- **Maintain consistent difficulty levels**

### Data Import:

- **Validate data** before importing
- **Check for duplicates** in existing questions
- **Use templates** for consistent formatting
- **Review import results** for errors
- **Backup data** before major changes

### Quality Control:

- **Verify question accuracy** before adding
- **Check mark allocations** match question difficulty
- **Ensure proper categorization** for topic-based filtering
- **Test detection logic** with new questions

## 🚨 Troubleshooting

### Common Issues:

1. **Questions not appearing**:
   - Check if Firestore sync is needed
   - Verify data was imported correctly
   - Check for validation errors

2. **Detection not working**:
   - Use `/test-detection` to debug
   - Check question format and metadata
   - Verify database contains the question

3. **Import failures**:
   - Check CSV/JSON format
   - Verify required fields are filled
   - Check for duplicate IDs

4. **Firestore errors**:
   - Use `/debug-firestore` to inspect data
   - Check Firebase configuration
   - Verify network connectivity

### Getting Help:

- **Check console logs** for error messages
- **Use debug tools** to inspect data
- **Verify data format** matches templates
- **Test with simple examples** first

## 🔗 Related Files

- **Static Data**: `data/pastExamQuestions.ts`, `data/fullExamPapers.ts`
- **Services**: `services/examPaperService.ts`, `services/progressService.ts`
- **Hooks**: `hooks/useExamPapers.ts`, `hooks/useProgress.ts`
- **API Routes**: `app/api/chat/route.ts`

## 📈 Future Enhancements

- **Activity monitoring** and audit logs
- **Bulk question editing** capabilities
- **Advanced search and filtering**
- **Question versioning** and history
- **Automated data validation**
- **External API integration** for real-time updates

---

**Need help?** Use the debug tools and check the console logs for detailed error information.
