'use client';

import React, { useState, useEffect } from 'react';
import { useExamPapers } from '@/hooks/useExamPapers';
import { examPaperService } from '@/services/examPaperService';
import { ArrowLeft, Upload, CheckCircle, AlertCircle, Database } from 'lucide-react';
import Link from 'next/link';

export default function ImportExamPapersPage() {
  console.log('🚀 ImportExamPapersPage component rendered');
  
  // Removed unused state variables

  // Use the working hook
  const { 
    hasData, 
    fullExamPapers, 
    examPapers, 
    pastExamQuestions,
    isLoading,
    error: examPapersError
  } = useExamPapers();

  // Debug: Log state changes
  useEffect(() => {
    console.log('📊 State updated:', {
      fullExamPapers: fullExamPapers.length,
      examPapers: examPapers.length,
      pastExamQuestions: pastExamQuestions.length,
      isLoading,
      hasData
    });
  }, [fullExamPapers, examPapers, pastExamQuestions, isLoading, hasData]);

  // Removed handleBulkImport function - no longer needed

  const handleRefresh = async () => {
    console.log('🔄 Refresh clicked');
    // The hook will automatically refresh data
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link 
              href="/admin" 
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Admin</span>
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">Exam Papers Database</h1>
          <p className="text-gray-600 mt-2">
            View and manage exam papers stored in Firestore database
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Full Exam Papers</p>
                <p className="text-2xl font-bold text-gray-900">{fullExamPapers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Database className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Exam Papers</p>
                <p className="text-2xl font-bold text-gray-900">{examPapers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Database className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Past Questions</p>
                <p className="text-2xl font-bold text-gray-900">{pastExamQuestions.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Database Management */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Database className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Database Management</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Manage exam papers in the Firestore database. Add new papers through the admin interface or import from external sources.
          </p>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => alert('Please use the admin interface to add exam papers manually or import from external sources.')}
              disabled={isLoading}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Database className="w-4 h-4" />
              <span>Add Exam Papers</span>
            </button>
            
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Refresh Data</span>
            </button>

            <button
              onClick={async () => {
                try {
                  console.log('🧪 Testing Firestore connection...');
                  const hasData = await examPaperService.hasExamPapers();
                  console.log('✅ Firestore connection successful. Has data:', hasData);
                  alert(`Firestore connection successful! Has existing data: ${hasData}`);
                } catch (error) {
                  console.error('❌ Firestore connection failed:', error);
                  alert(`Firestore connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
              }}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              🧪 Test Connection
            </button>
          </div>

          {examPapersError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800 font-medium">Error:</span>
                <span className="text-red-700">{examPapersError}</span>
              </div>
            </div>
          )}

        </div>

        {/* Data Preview */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Preview</h2>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading data...</p>
            </div>
          ) : (
            <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Full Exam Papers ({fullExamPapers.length})</h3>
              <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                {fullExamPapers.length > 0 ? (
                  <ul className="space-y-2">
                    {fullExamPapers.map((paper, index) => (
                      <li key={paper.id || index} className="text-sm text-gray-700">
                        {paper.examBoard} {paper.year} {paper.paper} - {paper.difficulty} ({paper.totalMarks} marks)
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No full exam papers found</p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Past Questions ({pastExamQuestions.length})</h3>
              <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                {pastExamQuestions.length > 0 ? (
                  <ul className="space-y-2">
                    {pastExamQuestions.map((question, index) => (
                      <li key={question.id || index} className="text-sm text-gray-700">
                        {question.question} ({question.marks} marks, {question.topic})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No past questions found</p>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
