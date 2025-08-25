'use client';

import React, { useState } from 'react';
import { examPaperService } from '@/services/examPaperService';

export default function TestDetectionPage() {
  const [testQuestion] = useState("Magana decides to put £500 into an account that pays compound interest. She wants to have at least £560 in the account after 3 years. Work out to 1 decimal place the minimum annual interest rate she needs.");
  const [result, setResult] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const testDetection = async () => {
    // Clear previous logs
    setLogs([]);
    setResult(null);

    // Capture console logs
    const originalLog = console.log;
    const capturedLogs: string[] = [];
    
    console.log = (...args) => {
      const logMessage = args.map(arg => 
        typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)
      ).join(' ');
      capturedLogs.push(logMessage);
      originalLog.apply(console, args);
    };

    try {
      // Add immediate feedback
      setLogs(['🧪 Starting detection test...']);
      
      console.log('🧪 Testing detection with question:', testQuestion);
      const detected = await examPaperService.detectExamQuestion(testQuestion);
      
      // Add result to logs
      if (detected) {
        capturedLogs.push(`✅ DETECTION SUCCESSFUL! Found: ${detected.examBoard} ${detected.year} ${detected.paper} Q${detected.questionNumber}`);
      } else {
        capturedLogs.push('❌ NO MATCH FOUND - Question not recognized');
      }
      
      setResult(detected);
      
      // Restore console.log
      console.log = originalLog;
      
      // Set captured logs
      setLogs(capturedLogs);
      
    } catch (error) {
      console.log = originalLog;
      setLogs([...capturedLogs, `❌ Error: ${error}`]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          🧪 Test Exam Question Detection
        </h1>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Question</h2>
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <p className="text-gray-800">{testQuestion}</p>
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={testDetection}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              🧪 Test Detection
            </button>
            <button 
              onClick={async () => {
                try {
                  const pastQuestions = await examPaperService.getAllPastExamQuestions();
                  const found = pastQuestions.find((q: any) => 
                    q.question.includes('Magana') || q.question.includes('compound interest')
                  );
                  if (found) {
                    setLogs([`✅ Question found in database: ${found.examBoard} ${found.year} ${found.paper} Q${found.questionNumber}`]);
                  } else {
                    setLogs(['❌ Question NOT found in database']);
                  }
                } catch (error) {
                  setLogs([`❌ Error checking database: ${error}`]);
                }
              }}
              className="bg-green-600 text-white px-4 py-4 rounded-lg hover:bg-green-700"
            >
              🔍 Check Database
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Detection Result</h2>
            <div className="bg-green-100 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">✅ Match Found!</h3>
              <div className="text-green-700">
                <p><strong>ID:</strong> {result.id}</p>
                <p><strong>Exam Board:</strong> {result.examBoard}</p>
                <p><strong>Year:</strong> {result.year}</p>
                <p><strong>Paper:</strong> {result.paper}</p>
                <p><strong>Question:</strong> {result.questionNumber}</p>
                <p><strong>Category:</strong> {result.category}</p>
                <p><strong>Marks:</strong> {result.marks}</p>
                <p><strong>Difficulty:</strong> {result.difficulty}</p>
                <p><strong>Topic:</strong> {result.topic}</p>
              </div>
            </div>
          </div>
        )}

        {result === null && logs.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Detection Result</h2>
            <div className="bg-red-100 p-4 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">❌ No Match Found</h3>
              <p className="text-red-700">The question was not recognized as a past exam question.</p>
            </div>
          </div>
        )}

        {logs.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Console Logs</h2>
            <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="text-sm font-mono text-gray-800 mb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
