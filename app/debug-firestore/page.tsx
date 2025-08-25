'use client';

import React, { useState, useEffect } from 'react';
import { examPaperService } from '@/services/examPaperService';

export default function DebugFirestorePage() {
  const [firestoreData, setFirestoreData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkFirestoreData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Checking Firestore data for AQA 2023 Paper 1H...');
      
      // Get all full exam papers
      const allPapers = await examPaperService.getAllFullExamPapers();
      console.log('📚 All full exam papers:', allPapers);
      
      // Find AQA 2023 Paper 1H specifically
      const aqa2023Paper1H = allPapers.find(paper => 
        paper.examBoard === 'AQA' && 
        paper.year === 2023 && 
        paper.paper === 'Paper 1H'
      );
      
      console.log('🎯 AQA 2023 Paper 1H found:', aqa2023Paper1H);
      
      if (aqa2023Paper1H) {
        console.log('📊 Question count:', aqa2023Paper1H.questions.length);
        console.log('📝 Questions:', aqa2023Paper1H.questions);
        console.log('🏆 Total marks:', aqa2023Paper1H.totalMarks);
      } else {
        console.log('❌ AQA 2023 Paper 1H not found in Firestore');
      }
      
      // Get past exam questions count
      const pastQuestions = await examPaperService.getAllPastExamQuestions();
      const aqa2023Paper1HQuestions = pastQuestions.filter(q => 
        q.examBoard === 'AQA' && 
        q.year === 2023 && 
        q.paper === 'Paper 1H'
      );
      
      console.log('📋 Past exam questions for AQA 2023 Paper 1H:', aqa2023Paper1HQuestions.length);
      
      setFirestoreData({
        allPapers,
        aqa2023Paper1H,
        pastQuestionsCount: pastQuestions.length,
        aqa2023Paper1HPastQuestions: aqa2023Paper1HQuestions
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Error checking Firestore:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAndReimport = async () => {
    if (!confirm('This will clear all exam papers from Firestore. Continue?')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🧹 Clearing all exam papers from Firestore...');
      await examPaperService.clearAllExamPapers();
      console.log('✅ Clear completed successfully!');
      
      // Refresh the data
      await checkFirestoreData();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Error during clear:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkFirestoreData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          🔍 Firestore Data Verification
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <button
            onClick={checkFirestoreData}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Checking...' : '🔍 Check Firestore Data'}
          </button>
          
          <button
            onClick={clearAndReimport}
            disabled={isLoading}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : '🗑️ Clear All Data'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {firestoreData && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {firestoreData.allPapers.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Full Exam Papers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {firestoreData.pastQuestionsCount}
                  </div>
                  <div className="text-sm text-gray-600">Total Past Questions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {firestoreData.aqa2023Paper1HPastQuestions.length}
                  </div>
                  <div className="text-sm text-gray-600">AQA 2023 Paper 1H Questions</div>
                </div>
              </div>
            </div>

            {/* AQA 2023 Paper 1H Details */}
            {firestoreData.aqa2023Paper1H ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  🎯 AQA 2023 Paper 1H Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <strong>Exam Board:</strong> {firestoreData.aqa2023Paper1H.examBoard}
                  </div>
                  <div>
                    <strong>Year:</strong> {firestoreData.aqa2023Paper1H.year}
                  </div>
                  <div>
                    <strong>Paper:</strong> {firestoreData.aqa2023Paper1H.paper}
                  </div>
                  <div>
                    <strong>Level:</strong> {firestoreData.aqa2023Paper1H.level}
                  </div>
                  <div>
                    <strong>Difficulty:</strong> {firestoreData.aqa2023Paper1H.difficulty}
                  </div>
                  <div>
                    <strong>Total Marks:</strong> {firestoreData.aqa2023Paper1H.totalMarks}
                  </div>
                  <div>
                    <strong>Question Count:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
                      firestoreData.aqa2023Paper1H.questions.length === 30 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {firestoreData.aqa2023Paper1H.questions.length} / 30
                    </span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">📝 Questions:</h3>
                  <div className="max-h-60 overflow-y-auto border rounded p-3 bg-gray-50">
                    {firestoreData.aqa2023Paper1H.questions.map((q: any, index: number) => (
                      <div key={index} className="mb-2 p-2 bg-white rounded border-l-4 border-blue-500">
                        <div className="font-medium">Q{q.questionNumber}: {q.question}</div>
                        <div className="text-sm text-gray-600">
                          {q.topic} • {q.marks} marks • {q.difficulty}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                <strong>⚠️ Not Found:</strong> AQA 2023 Paper 1H is not present in Firestore
              </div>
            )}

            {/* All Papers List */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">📚 All Full Exam Papers</h2>
              <div className="space-y-2">
                {firestoreData.allPapers.map((paper: any) => (
                  <div key={paper.id} className="p-3 border rounded hover:bg-gray-50">
                    <div className="font-medium">
                      {paper.examBoard} {paper.year} {paper.paper}
                    </div>
                    <div className="text-sm text-gray-600">
                      {paper.questions.length} questions • {paper.totalMarks} marks • {paper.level} • {paper.difficulty}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing...</p>
          </div>
        )}
      </div>
    </div>
  );
}
