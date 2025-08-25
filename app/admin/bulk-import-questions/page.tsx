'use client';

import React, { useState } from 'react';
import { examPaperService } from '@/services/examPaperService';

interface BulkQuestion {
  question: string;
  examBoard: string;
  year: number;
  paper: string;
  level: 'GCSE' | 'A-Level';
  questionNumber: string;
  category: string;
  marks: number;
  difficulty: 'Foundation' | 'Higher';
  topic: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export default function BulkImportQuestionsPage() {
  const [bulkQuestions, setBulkQuestions] = useState<BulkQuestion[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [jsonText, setJsonText] = useState('');

  // Debug: Check if service is available
  console.log('🔍 BulkImportQuestionsPage loaded');
  console.log('📦 examPaperService available:', !!examPaperService);
  console.log('📦 examPaperService methods:', Object.keys(examPaperService || {}));

  const addEmptyQuestion = () => {
    const newQuestion: BulkQuestion = {
      question: '',
      examBoard: '',
      year: new Date().getFullYear(),
      paper: '',
      level: 'GCSE',
      questionNumber: '',
      category: '',
      marks: 1,
      difficulty: 'Foundation',
      topic: ''
    };
    setBulkQuestions([...bulkQuestions, newQuestion]);
  };

  const updateQuestion = (index: number, field: keyof BulkQuestion, value: any) => {
    const updated = [...bulkQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setBulkQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setBulkQuestions(bulkQuestions.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setBulkQuestions([]);
    setImportResult(null);
    setCsvText('');
    setJsonText('');
  };

  const validateQuestion = (q: BulkQuestion): string[] => {
    const errors: string[] = [];
    
    if (!q.question.trim()) errors.push('Question text is required');
    if (!q.examBoard.trim()) errors.push('Exam board is required');
    if (q.year < 2000 || q.year > 2030) errors.push('Year must be between 2000-2030');
    if (q.marks < 1 || q.marks > 20) errors.push('Marks must be between 1-20');
    

    
    return errors;
  };

  const importFromCSV = () => {
    if (!csvText.trim()) {
      alert('Please enter CSV data');
      return;
    }

    try {
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const questions: BulkQuestion[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < headers.length) continue;
        
        const question: BulkQuestion = {
          question: values[headers.indexOf('question')] || '',
          examBoard: values[headers.indexOf('examboard')] || '',
          year: parseInt(values[headers.indexOf('year')]) || new Date().getFullYear(),
          paper: values[headers.indexOf('paper')] || '',
          level: (values[headers.indexOf('level')] as 'GCSE' | 'A-Level') || 'GCSE',
          questionNumber: values[headers.indexOf('questionnumber')] || '',
          category: values[headers.indexOf('category')] || '',
          marks: parseInt(values[headers.indexOf('marks')]) || 1,
          difficulty: (values[headers.indexOf('difficulty')] as 'Foundation' | 'Higher') || 'Foundation',
          topic: values[headers.indexOf('topic')] || ''
        };
        
        questions.push(question);
      }
      
      setBulkQuestions(questions);
      alert(`Imported ${questions.length} questions from CSV`);
      
    } catch (error) {
      alert('Error parsing CSV. Please check the format.');
      console.error('CSV parse error:', error);
    }
  };

  const importFromJSON = () => {
    if (!jsonText.trim()) {
      alert('Please enter JSON data');
      return;
    }

    try {
      const questions = JSON.parse(jsonText);
      if (Array.isArray(questions)) {
        setBulkQuestions(questions);
        alert(`Imported ${questions.length} questions from JSON`);
      } else {
        alert('JSON must contain an array of questions');
      }
    } catch (error) {
      alert('Error parsing JSON. Please check the format.');
      console.error('JSON parse error:', error);
    }
  };

  const exportToCSV = () => {
    if (bulkQuestions.length === 0) {
      alert('No questions to export');
      return;
    }

    const headers = ['Question', 'Exam Board', 'Year', 'Paper', 'Level', 'Question Number', 'Category', 'Marks', 'Difficulty', 'Topic'];
    const csvContent = [
      headers.join(','),
              ...bulkQuestions.map(q => [
          `"${q.question.replace(/"/g, '""')}"`,
          q.examBoard,
          q.year,
          q.paper,
          q.level,
          q.questionNumber,
          q.category,
          q.marks,
          q.difficulty,
          q.topic
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-questions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const processBulkImport = async () => {
    if (bulkQuestions.length === 0) {
      alert('No questions to import');
      return;
    }

    console.log('🚀 Starting bulk import of', bulkQuestions.length, 'questions...');
    setIsImporting(true);
    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    try {
      // Check if Firestore is available
      console.log('🔍 Checking Firestore availability...');
      
      // Test Firestore connection first
      try {
        const hasData = await examPaperService.hasExamPapers();
        console.log('✅ Firestore connection successful. Has data:', hasData);
      } catch (connectionError) {
        console.error('❌ Firestore connection failed:', connectionError);
        throw new Error(`Firestore connection failed: ${connectionError instanceof Error ? connectionError.message : 'Unknown error'}`);
      }
      
      for (let i = 0; i < bulkQuestions.length; i++) {
        const question = bulkQuestions[i];
        console.log(`📝 Processing question ${i + 1}:`, question);
        
        const errors = validateQuestion(question);
        
        if (errors.length === 0) {
          try {
            // Save question to Firestore
            const questionData = {
              question: question.question,
              examBoard: question.examBoard,
              year: question.year,
              paper: question.paper,
              level: question.level,
              questionNumber: question.questionNumber,
              category: question.category,
              marks: question.marks,
              difficulty: question.difficulty,
              topic: question.topic
            };
            
            console.log(`💾 Saving question ${i + 1} to database:`, questionData);
            const questionId = await examPaperService.addPastExamQuestion(questionData);
            console.log(`✅ Question ${i + 1} imported successfully with ID:`, questionId);
            result.success++;
          } catch (saveError) {
            console.error(`❌ Error saving question ${i + 1}:`, saveError);
            result.failed++;
            const errorMsg = `Row ${i + 1}: Failed to save to database - ${saveError instanceof Error ? saveError.message : 'Unknown error'}`;
            result.errors.push(errorMsg);
          }
        } else {
          console.log(`❌ Validation failed for question ${i + 1}:`, errors);
          result.failed++;
          result.errors.push(`Row ${i + 1}: ${errors.join(', ')}`);
        }
      }
    } catch (error) {
      console.error('❌ Bulk import error:', error);
      result.errors.push(`Bulk import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log('📊 Import completed. Results:', result);
    setImportResult(result);
    setIsImporting(false);
    
    if (result.success > 0) {
      alert(`Import completed: ${result.success} successful, ${result.failed} failed`);
    } else if (result.failed > 0) {
      alert(`Import failed: ${result.failed} questions failed to import. Check the error details below.`);
    }
  };

  const getCSVTemplate = () => {
    const template = `Question,Exam Board,Year,Paper,Level,Question Number,Category,Marks,Difficulty,Topic
"Solve the equation 3x + 7 = 22",AQA,2023,Paper 1H,GCSE,1,Algebra,2,Foundation,Linear Equations
"Calculate the area of a circle with radius 5cm",Edexcel,2022,Paper 1F,GCSE,3,Geometry,3,Foundation,Area and Perimeter`;
    
    setCsvText(template);
  };

  const getJSONTemplate = () => {
    const template = [
      {
        "question": "Solve the equation 3x + 7 = 22",
        "examBoard": "AQA",
        "year": 2023,
        "paper": "Paper 1H",
        "level": "GCSE",
        "questionNumber": "1",
        "category": "Algebra",
        "marks": 2,
        "difficulty": "Foundation",
        "topic": "Linear Equations"
      },
      {
        "question": "Calculate the area of a circle with radius 5cm",
        "examBoard": "Edexcel",
        "year": 2022,
        "paper": "Paper 1F",
        "level": "GCSE",
        "questionNumber": "3",
        "category": "Geometry",
        "marks": 3,
        "difficulty": "Foundation",
        "topic": "Area and Perimeter"
      }
    ];
    
    setJsonText(JSON.stringify(template, null, 2));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Import Exam Questions</h1>
          <p className="text-gray-600">Import multiple exam questions at once from CSV, JSON, or manual entry</p>
        </div>

        {/* Test Firestore Connection */}
        <div className="mb-6">
          <button
            onClick={async () => {
              try {
                console.log('🧪 Testing Firestore connection...');
                console.log('📦 examPaperService:', examPaperService);
                const hasData = await examPaperService.hasExamPapers();
                console.log('✅ Firestore connection successful. Has data:', hasData);
                alert(`Firestore connection successful! Has existing data: ${hasData}`);
              } catch (error) {
                console.error('❌ Firestore connection failed:', error);
                alert(`Firestore connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
          >
            🧪 Test Firestore Connection
          </button>
        </div>

        {/* Import Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* CSV Import */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 CSV Import</h3>
            <div className="space-y-4">
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Paste CSV data here..."
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex space-x-2">
                <button
                  onClick={getCSVTemplate}
                  className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
                >
                  Get Template
                </button>
                <button
                  onClick={importFromCSV}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Import CSV
                </button>
              </div>
            </div>
          </div>

          {/* JSON Import */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 JSON Import</h3>
            <div className="space-y-4">
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder="Paste JSON data here..."
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex space-x-2">
                <button
                  onClick={getJSONTemplate}
                  className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
                >
                  Get Template
                </button>
                <button
                  onClick={importFromJSON}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Import JSON
                </button>
              </div>
            </div>
          </div>

          {/* Manual Entry */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">✏️ Manual Entry</h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Add questions one by one or use the bulk form below
              </p>
              <button
                onClick={addEmptyQuestion}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                ➕ Add Empty Question
              </button>
              <button
                onClick={clearAll}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                🗑️ Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Questions Form */}
        {bulkQuestions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Bulk Questions ({bulkQuestions.length})
          </h2>
          <div className="flex space-x-4">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              📥 Export to CSV
            </button>
            <button
              onClick={processBulkImport}
              disabled={isImporting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isImporting ? '🔄 Processing...' : '🚀 Process Import'}
            </button>
          </div>
        </div>

        {/* Import Progress */}
        {isImporting && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-blue-800">Importing questions to database...</span>
            </div>
          </div>
        )}

            {/* Questions List */}
            <div className="space-y-6">
              {bulkQuestions.map((question, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Question {index + 1}</h3>
                    <button
                      onClick={() => removeQuestion(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      🗑️ Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Question Text *</label>
                      <textarea
                        value={question.question}
                        onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter the full question text..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Exam Board *</label>
                      <input
                        type="text"
                        value={question.examBoard}
                        onChange={(e) => updateQuestion(index, 'examBoard', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., AQA, Edexcel, OCR"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                      <input
                        type="number"
                        value={question.year}
                        onChange={(e) => updateQuestion(index, 'year', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="2000"
                        max="2030"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Paper</label>
                      <input
                        type="text"
                        value={question.paper}
                        onChange={(e) => updateQuestion(index, 'paper', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Paper 1H, Paper 2F"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Level *</label>
                      <select
                        value={question.level}
                        onChange={(e) => updateQuestion(index, 'level', e.target.value as 'GCSE' | 'A-Level')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="GCSE">GCSE</option>
                        <option value="A-Level">A-Level</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Question Number</label>
                      <input
                        type="text"
                        value={question.questionNumber}
                        onChange={(e) => updateQuestion(index, 'questionNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 1, 2a, 3b"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <input
                        type="text"
                        value={question.category}
                        onChange={(e) => updateQuestion(index, 'category', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Algebra, Geometry, Number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Marks</label>
                      <input
                        type="number"
                        value={question.marks}
                        onChange={(e) => updateQuestion(index, 'marks', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max="20"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                                        <select
                    value={question.difficulty}
                    onChange={(e) => updateQuestion(index, 'difficulty', e.target.value as 'Foundation' | 'Higher')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Foundation">Foundation</option>
                    <option value="Higher">Higher</option>
                  </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                      <input
                        type="text"
                        value={question.topic}
                        onChange={(e) => updateQuestion(index, 'topic', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Linear Equations, Area, Probability"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Import Results */}
        {importResult && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Import Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{importResult.success + importResult.failed}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Errors:</h3>
                <div className="bg-red-50 border border-red-200 rounded-md p-4 max-h-40 overflow-y-auto">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-700 mb-1">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">📋 How to Use</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">CSV Format:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• First row should contain headers</li>
                <li>• Use commas to separate values</li>
                <li>• Wrap text in quotes if it contains commas</li>
                <li>• Click "Get Template" for an example</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">JSON Format:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Array of question objects</li>
                <li>• Each object should have all required fields</li>
                <li>• Click "Get Template" for an example</li>
                <li>• Validate JSON before importing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
