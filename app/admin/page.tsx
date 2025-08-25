'use client';

import React, { useState } from 'react';
import AdminNavigation from '@/components/AdminNavigation';
import { Search, Database, AlertCircle, CheckCircle, Globe, Wifi, WifiOff, ExternalLink } from 'lucide-react';
import { ExamPaperSearchService, ExternalExamPaper } from '@/services/examPaperSearchService';
// Temporarily disabled to fix runtime error
// import { RealExamPaperSearchService, RealExamPaper } from '@/services/realExamPaperSearchService';

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔧 Admin Dashboard</h1>
          <p className="text-gray-600">Manage exam papers, questions, and system configuration</p>
        </div>

        <AdminNavigation />

        {/* System Overview */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 System Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Database Connection</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">Connected</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">AI Models Available</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">3 Models</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Image Processing</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Progress Tracking</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">Enabled</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Quick Start Guide</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 font-medium">1.</span>
                <span>Use <strong>Manage Exam Papers</strong> to add individual questions</span>
              </div>

              <div className="flex items-start space-x-2">
                <span className="text-blue-600 font-medium">2.</span>
                <span>Use <strong>Import Exam Papers</strong> to sync with Firestore</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 font-medium">3.</span>
                <span>Use <strong>Debug Tools</strong> to verify data integrity</span>
              </div>
            </div>
          </div>
        </div>

        {/* Exam Paper Search & Import */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Search & Import Exam Papers</h3>
          <ExamPaperSearchImport />
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Recent Activity</h3>
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <p>Activity monitoring coming soon...</p>
            <p className="text-sm">Track question additions, imports, and system usage</p>
          </div>
        </div>

        {/* Support Information */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Tips & Support</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Adding Questions Manually</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Navigate to "Manage Exam Papers"</li>
                <li>• Click "Add New Question"</li>
                <li>• Fill in all required fields (marked with *)</li>
                <li>• Use descriptive topics for better organization</li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// Exam Paper Search & Import Component
function ExamPaperSearchImport() {
  const [searchParams, setSearchParams] = useState({
    examBoard: '',
    year: '',
    paper: ''
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ExternalExamPaper[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);
  const [apiStatus, setApiStatus] = useState<Record<string, boolean>>({});

  const examBoards = ExamPaperSearchService.getAvailableExamBoards();
  const years = ExamPaperSearchService.getSupportedYears();
  const papers = ExamPaperSearchService.getSupportedPaperTypes();

  // Check API status for all exam boards on component mount
  React.useEffect(() => {
    const checkAllApiStatus = async () => {
      const status: Record<string, boolean> = {};
      for (const board of examBoards) {
        status[board] = await ExamPaperSearchService.checkApiAvailability(board);
      }
      setApiStatus(status);
    };
    
    checkAllApiStatus();
  }, [examBoards]);

  const handleSearch = async () => {
    if (!searchParams.examBoard || !searchParams.year) {
      alert('Please select an exam board and year');
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setImportResult(null);

    try {
      console.log('🔍 Searching for exam papers:', searchParams);
      
      let searchResult;
      
      // Check API availability first
      const isAvailable = await ExamPaperSearchService.checkApiAvailability(searchParams.examBoard);
      setApiStatus(prev => ({ ...prev, [searchParams.examBoard]: isAvailable }));
      
      if (!isAvailable) {
        throw new Error(`${searchParams.examBoard} API is currently unavailable`);
      }

      console.log('🎭 Using mock search for:', searchParams.examBoard);
      searchResult = await ExamPaperSearchService.searchExamPapers(
        searchParams.examBoard,
        parseInt(searchParams.year),
        searchParams.paper || undefined
      );
      
      setSearchResults(searchResult.papers);
      console.log('✅ Mock search completed, found:', searchResult.papers.length, 'papers');
      
    } catch (error) {
      console.error('❌ Search failed:', error);
      setSearchResults([]);
      alert(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleImport = async (examPaper: ExternalExamPaper) => {
    if (!confirm(`Import "${examPaper.title}" to the database?`)) {
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      console.log('📥 Importing exam paper:', examPaper);
      
      let result;
      
      // Temporarily use mock import service for all exam boards to fix runtime error
      console.log('🎭 Using mock import service for:', examPaper.examBoard);
      result = await ExamPaperSearchService.importExamPaper(examPaper);
      
      if (result.success) {
        const importDetails = {
          paperId: result.paperId,
          questionsImported: result.questionsImported,
          topics: result.topics,
          difficulty: result.difficulty
        };

        setImportResult({
          success: true,
          message: `Successfully imported "${examPaper.title}"`,
          details: importDetails
        });

        console.log('✅ Import completed:', importDetails);
        
        // Remove from search results to show it's been imported
        setSearchResults(prev => prev.filter(p => p.id !== examPaper.id));
      } else {
        throw new Error(result.error || 'Import failed');
      }
      
    } catch (error) {
      console.error('❌ Import failed:', error);
      setImportResult({
        success: false,
        message: 'Import failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsImporting(false);
    }
  };



  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam Board *
            </label>
            <div className="relative">
              <select
                value={searchParams.examBoard}
                onChange={(e) => setSearchParams(prev => ({ ...prev, examBoard: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Exam Board</option>
                {examBoards.map(board => (
                  <option key={board} value={board}>{board}</option>
                ))}
              </select>
              {searchParams.examBoard && apiStatus[searchParams.examBoard] !== undefined && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  {apiStatus[searchParams.examBoard] ? (
                    <Wifi className="w-4 h-4 text-green-600" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-600" />
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year *
            </label>
            <select
              value={searchParams.year}
              onChange={(e) => setSearchParams(prev => ({ ...prev, year: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Year</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paper (Optional)
            </label>
            <select
              value={searchParams.paper}
              onChange={(e) => setSearchParams(prev => ({ ...prev, paper: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any Paper</option>
              {papers.map(paper => (
                <option key={paper} value={paper}>{paper}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchParams.examBoard || !searchParams.year}
              className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSearching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-gray-900">
              Found {searchResults.length} Exam Papers
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map((paper) => (
              <div key={paper.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h5 className="font-medium text-gray-900">{paper.title}</h5>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      paper.level === 'A-Level' 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {paper.level}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      paper.difficulty === 'Higher' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {paper.difficulty}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex justify-between">
                    <span>Level:</span>
                    <span className="font-medium">{paper.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Questions:</span>
                    <span className="font-medium">{paper.questionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Marks:</span>
                    <span className="font-medium">{paper.totalMarks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Topics:</span>
                    <span className="font-medium">{paper.topics.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Source:</span>
                    <span className="font-medium flex items-center space-x-1">
                      {paper.source === 'AQA Official Website' ? (
                        <>
                          <Globe className="w-3 h-3 text-green-600" />
                          <span className="text-green-600">Real-time AQA</span>
                        </>
                      ) : (
                        <>
                          <Database className="w-3 h-3 text-blue-600" />
                          <span className="text-blue-600">Mock Data</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleImport(paper)}
                    disabled={isImporting}
                    className="w-full inline-flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {isImporting ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        <span>Importing...</span>
                      </>
                    ) : (
                      <>
                        <Database className="w-3 h-3" />
                        <span>Import to Database</span>
                      </>
                    )}
                  </button>
                  
                  {paper.source === 'AQA Official Website' && paper.downloadUrl && (
                    <a
                      href={paper.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View on AQA Website</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import Result */}
      {importResult && (
        <div className={`p-4 rounded-lg border ${
          importResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center space-x-3">
            {importResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <div>
              <h4 className={`font-medium ${
                importResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {importResult.success ? 'Import Successful' : 'Import Failed'}
              </h4>
              <p className={`text-sm ${
                importResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {importResult.message}
              </p>
              {importResult.details && (
                <div className="mt-2 text-xs text-gray-600">
                  <pre className="bg-white p-2 rounded border overflow-x-auto">
                    {JSON.stringify(importResult.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">💡 How to Use</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• Select an exam board and year to search for available exam papers</p>
          <p>• Optionally specify a paper type (Foundation/Higher)</p>
          <p>• Review search results and import individual papers</p>
          <p>• Imported papers will be saved to your database for student access</p>
        </div>
      </div>
    </div>
  );
}
