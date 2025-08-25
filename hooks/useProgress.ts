import { useState, useEffect, useCallback } from 'react';
import { progressService, UserProgress, CompletedQuestion } from '@/services/progressService';

export function useProgress(userId: string = 'default-user') {
  const [userProgress, setUserProgress] = useState<UserProgress>({
    userId,
    completedQuestions: [],
    stats: {
      totalCompleted: 0,
      byExamBoard: {},
      byYear: {},
      byCategory: {},
      byDifficulty: {},
      byTopic: {},
      completionRate: 0
    },
    lastUpdated: new Date()
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user progress from Firestore
  const loadUserProgress = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const progress = await progressService.getUserProgress(userId);
      setUserProgress(progress);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load progress';
      setError(errorMessage);
      console.error('Error loading user progress:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Add a completed question
  const addCompletedQuestion = useCallback(async (
    questionData: Omit<CompletedQuestion, 'completedAt' | 'userId'>
  ) => {
    try {
      setError(null);
      await progressService.addCompletedQuestion(userId, questionData);
      // Reload progress after adding question
      await loadUserProgress();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add completed question';
      setError(errorMessage);
      console.error('Error adding completed question:', err);
    }
  }, [userId, loadUserProgress]);

  // Update question status
  const updateQuestionStatus = useCallback(async (
    questionId: string,
    status: 'asked' | 'wrong' | 'correct',
    userAnswer?: string
  ) => {
    try {
      setError(null);
      await progressService.updateQuestionStatus(userId, questionId, status, userAnswer);
      // Reload progress after updating status
      await loadUserProgress();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update question status';
      setError(errorMessage);
      console.error('Error updating question status:', err);
    }
  }, [userId, loadUserProgress]);

  // Delete a question from progress
  const deleteQuestion = useCallback(async (questionId: string) => {
    try {
      setError(null);
      await progressService.deleteQuestion(userId, questionId);
      // Reload progress after deleting question
      await loadUserProgress();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete question';
      setError(errorMessage);
      console.error('Error deleting question:', err);
    }
  }, [userId, loadUserProgress]);

  // Get filtered progress
  const getFilteredProgress = useCallback(async (
    filter: string,
    sortBy: 'date' | 'marks' | 'difficulty' = 'date'
  ) => {
    try {
      setError(null);
      return await progressService.getProgressByFilter(userId, filter, sortBy);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get filtered progress';
      setError(errorMessage);
      console.error('Error getting filtered progress:', err);
      return [];
    }
  }, [userId]);

  // Get recent questions
  const getRecentQuestions = useCallback(async (limit: number = 10) => {
    try {
      setError(null);
      return await progressService.getRecentQuestions(userId, limit);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get recent questions';
      setError(errorMessage);
      console.error('Error getting recent questions:', err);
      return [];
    }
  }, [userId]);

  // Load progress on mount and when userId changes
  useEffect(() => {
    loadUserProgress();
  }, [loadUserProgress]);

  return {
    userProgress,
    isLoading,
    error,
    loadUserProgress,
    addCompletedQuestion,
    updateQuestionStatus,
    deleteQuestion,
    getFilteredProgress,
    getRecentQuestions
  };
}
