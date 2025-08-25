import { useState, useEffect, useCallback, useRef } from 'react';
import { examPaperService, FullExamPaper, ExamPaper, ExamQuestionMetadata } from '@/services/examPaperService';

export function useExamPapers() {
  const [fullExamPapers, setFullExamPapers] = useState<FullExamPaper[]>([]);
  const [examPapers, setExamPapers] = useState<ExamPaper[]>([]);
  const [pastExamQuestions, setPastExamQuestions] = useState<ExamQuestionMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);
  const isMountedRef = useRef(true);
  const isLoadingRef = useRef(false);

  // Load all exam paper data
  const loadExamPapers = useCallback(async () => {
    // Prevent multiple simultaneous loads using ref
    if (isLoadingRef.current) {
      console.log('🔄 Load already in progress, skipping...');
      return;
    }

    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);

      console.log('📚 Loading exam papers from Firestore...');

      // Check if we already have data in Firestore
      const hasExistingData = await examPaperService.hasExamPapers();
      
      if (!hasExistingData) {
        console.log('📚 No exam papers found in Firestore. Database is empty.');
        console.log('💡 Please add exam papers through the admin interface or import from external sources.');
      }

      // Load all data from Firestore
      const [fullPapers, papers, questions] = await Promise.all([
        examPaperService.getAllFullExamPapers(),
        examPaperService.getAllExamPapers(),
        examPaperService.getAllPastExamQuestions()
      ]);

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setFullExamPapers(fullPapers);
        setExamPapers(papers);
        setPastExamQuestions(questions);
        setHasData(true);
      }
      
      console.log(`📊 Loaded ${fullPapers.length} full exam papers, ${papers.length} exam papers, and ${questions.length} past questions`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load exam papers';
      console.error('❌ Error loading exam papers from Firestore:', err);
      
      // No fallback to static data - only use Firestore
      if (isMountedRef.current) {
        setError(`Firestore connection failed: ${errorMessage}. Please check your connection and try again.`);
      }
    } finally {
      isLoadingRef.current = false;
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []); // Remove isLoading dependency to prevent infinite loop

  // Get random exam questions
  const getRandomExamQuestions = useCallback(async (count: number = 3): Promise<ExamQuestionMetadata[]> => {
    try {
      return await examPaperService.getRandomExamQuestions(count);
    } catch (err) {
      console.error('Error getting random exam questions:', err);
      // Fallback to local data if Firestore fails
      return pastExamQuestions.sort(() => 0.5 - Math.random()).slice(0, count);
    }
  }, [pastExamQuestions]);

  // Get full exam paper by ID
  const getFullExamPaperById = useCallback(async (paperId: string): Promise<FullExamPaper | null> => {
    try {
      return await examPaperService.getFullExamPaperById(paperId);
    } catch (err) {
      console.error('Error getting full exam paper by ID:', err);
      return null;
    }
  }, []);

  // Get full exam paper by metadata
  const getFullExamPaperByMetadata = useCallback(async (
    examBoard: string, 
    year: number, 
    paper: string
  ): Promise<FullExamPaper | null> => {
    try {
      return await examPaperService.getFullExamPaperByMetadata(examBoard, year, paper);
    } catch (err) {
      console.error('Error getting full exam paper by metadata:', err);
      return null;
    }
  }, []);

  // Add new full exam paper
  const addFullExamPaper = useCallback(async (examPaper: Omit<FullExamPaper, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
    try {
      const paperId = await examPaperService.addFullExamPaper(examPaper);
      // Reload data to include the new paper
      await loadExamPapers();
      return paperId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add exam paper';
      setError(errorMessage);
      console.error('Error adding full exam paper:', err);
      return null;
    }
  }, []); // Remove loadExamPapers dependency

  // Add new exam paper
  const addExamPaper = useCallback(async (examPaper: Omit<ExamPaper, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
    try {
      const paperId = await examPaperService.addExamPaper(examPaper);
      // Reload data to include the new paper
      await loadExamPapers();
      return paperId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add exam paper';
      setError(errorMessage);
      console.error('Error adding exam paper:', err);
      return null;
    }
  }, []); // Remove loadExamPapers dependency

  // Add new past exam question
  const addPastExamQuestion = useCallback(async (question: Omit<ExamQuestionMetadata, 'id'>): Promise<string | null> => {
    try {
      const questionId = await examPaperService.addPastExamQuestion(question);
      // Reload data to include the new question
      await loadExamPapers();
      return questionId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add past exam question';
      setError(errorMessage);
      console.error('Error adding past exam question:', err);
      return null;
    }
  }, []); // Remove loadExamPapers dependency

  // Update full exam paper
  const updateFullExamPaper = useCallback(async (
    paperId: string, 
    updates: Partial<Omit<FullExamPaper, 'id' | 'createdAt'>>
  ): Promise<boolean> => {
    try {
      await examPaperService.updateFullExamPaper(paperId, updates);
      // Reload data to reflect changes
      await loadExamPapers();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update exam paper';
      setError(errorMessage);
      console.error('Error updating full exam paper:', err);
      return false;
    }
  }, []); // Remove loadExamPapers dependency

  // Delete full exam paper
  const deleteFullExamPaper = useCallback(async (paperId: string): Promise<boolean> => {
    try {
      await examPaperService.deleteFullExamPaper(paperId);
      // Reload data to reflect changes
      await loadExamPapers();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete exam paper';
      setError(errorMessage);
      console.error('Error deleting full exam paper:', err);
      return false;
    }
  }, []); // Remove loadExamPapers dependency

  // Refresh data
  const refresh = useCallback(async () => {
    await loadExamPapers();
  }, []); // Remove loadExamPapers dependency

  // Load data on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (isMounted) {
        console.log('🚀 useExamPapers: Starting initial data load...');
        try {
          await loadExamPapers();
        } catch (error) {
          console.error('❌ useExamPapers: Initial load failed:', error);
        }
      }
    };
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isMounted && isLoading) {
        console.warn('⚠️ useExamPapers: Loading timeout reached, forcing completion');
        setIsLoading(false);
        setError('Loading timeout - please check Firestore connection');
      }
    }, 30000); // 30 second timeout
    
    loadData();
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [loadExamPapers]); // Now safe to include loadExamPapers since we fixed the circular dependency

  return {
    // Data
    fullExamPapers,
    examPapers,
    pastExamQuestions,
    
    // State
    isLoading,
    error,
    hasData,
    
    // Actions
    loadExamPapers,
    getRandomExamQuestions,
    getFullExamPaperById,
    getFullExamPaperByMetadata,
    addFullExamPaper,
    addExamPaper,
    addPastExamQuestion,
    updateFullExamPaper,
    deleteFullExamPaper,
    refresh,
    
    // Clear error
    clearError: () => setError(null)
  };
}
