import { db } from '@/config/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  getDocs, 
  query, 
  orderBy, 
  limit, 
  where, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';

export interface CompletedQuestion {
  questionId: string;
  questionText: string;
  examBoard: string;
  year: number;
  paper: string;
  questionNumber: string;
  category: string;
  marks: number;
  difficulty: 'Foundation' | 'Higher';
  topic: string;
  completedAt: Date;
  userAnswer?: string;
  sessionId?: string;
  status: 'asked' | 'wrong' | 'correct';
  correctAnswer?: string;
  userId?: string;
}

export interface ProgressStats {
  totalCompleted: number;
  byExamBoard: Record<string, number>;
  byYear: Record<number, number>;
  byCategory: Record<string, number>;
  byDifficulty: Record<string, number>;
  byTopic: Record<string, number>;
  completionRate: number;
}

export interface UserProgress {
  userId: string;
  completedQuestions: CompletedQuestion[];
  stats: ProgressStats;
  lastUpdated: Date;
}

export class ProgressService {
  private readonly COLLECTION_NAME = 'userProgress';

  // Add a completed question to user progress
  async addCompletedQuestion(
    userId: string,
    questionData: Omit<CompletedQuestion, 'completedAt' | 'userId'>
  ): Promise<string> {
    try {
      const progressData = {
        ...questionData,
        userId,
        completedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), progressData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding completed question:', error);
      throw error;
    }
  }

  // Get user progress by userId
  async getUserProgress(userId: string): Promise<UserProgress> {
    try {
      // First get all documents for the user without ordering
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      const completedQuestions: CompletedQuestion[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        completedQuestions.push({
          ...data,
          completedAt: data.completedAt?.toDate() || new Date(),
          id: doc.id
        } as unknown as CompletedQuestion);
      });

      // Sort in memory instead of in the query to avoid index requirements
      completedQuestions.sort((a, b) => 
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );

      // Calculate stats
      const stats = this.calculateProgressStats(completedQuestions);
      
      return {
        userId,
        completedQuestions,
        stats,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting user progress:', error);
      throw error;
    }
  }

  // Get recent questions for a user
  async getRecentQuestions(userId: string, limit: number = 10): Promise<CompletedQuestion[]> {
    try {
      // Get all questions for the user without ordering to avoid index requirements
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      const recentQuestions: CompletedQuestion[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        recentQuestions.push({
          ...data,
          completedAt: data.completedAt?.toDate() || new Date(),
          id: doc.id
        } as unknown as CompletedQuestion);
      });

      // Sort in memory and limit
      recentQuestions.sort((a, b) => 
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );

      return recentQuestions.slice(0, limit);
    } catch (error) {
      console.error('Error getting recent questions:', error);
      throw error;
    }
  }

  // Update question status
  async updateQuestionStatus(
    userId: string,
    questionId: string,
    status: 'asked' | 'wrong' | 'correct',
    userAnswer?: string
  ): Promise<void> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        where('questionId', '==', questionId)
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docRef = doc(db, this.COLLECTION_NAME, snapshot.docs[0].id);
        await updateDoc(docRef, {
          status,
          userAnswer: userAnswer || null,
          lastUpdated: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error updating question status:', error);
      throw error;
    }
  }

  // Delete a question from user progress
  async deleteQuestion(
    userId: string,
    questionId: string
  ): Promise<void> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        where('questionId', '==', questionId)
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docRef = doc(db, this.COLLECTION_NAME, snapshot.docs[0].id);
        await deleteDoc(docRef);
        console.log('✅ Question deleted from progress:', questionId);
      } else {
        console.warn('⚠️ Question not found for deletion:', questionId);
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  }

  // Calculate progress statistics
  private calculateProgressStats(completedQuestions: CompletedQuestion[]): ProgressStats {
    const stats: ProgressStats = {
      totalCompleted: completedQuestions.length,
      byExamBoard: {},
      byYear: {},
      byCategory: {},
      byDifficulty: {},
      byTopic: {},
      completionRate: 0
    };

    // Calculate statistics from completed questions
    completedQuestions.forEach(question => {
      // By exam board
      stats.byExamBoard[question.examBoard] = (stats.byExamBoard[question.examBoard] || 0) + 1;
      
      // By year
      stats.byYear[question.year] = (stats.byYear[question.year] || 0) + 1;
      
      // By category
      stats.byCategory[question.category] = (stats.byCategory[question.category] || 0) + 1;
      
      // By difficulty
      stats.byDifficulty[question.difficulty] = (stats.byDifficulty[question.difficulty] || 0) + 1;
      
      // By topic
      stats.byTopic[question.topic] = (stats.byTopic[question.topic] || 0) + 1;
    });

    // Calculate completion rate (assuming we know total available questions)
    const totalAvailableQuestions = 18; // Update this when we add more questions
    stats.completionRate = Math.round((stats.totalCompleted / totalAvailableQuestions) * 100);

    return stats;
  }

  // Get progress by filter
  async getProgressByFilter(
    userId: string,
    filter: string,
    sortBy: 'date' | 'marks' | 'difficulty' = 'date'
  ): Promise<CompletedQuestion[]> {
    try {
      const allQuestions = await this.getUserProgress(userId);
      let filteredQuestions = allQuestions.completedQuestions;

      // Apply filters
      if (filter !== 'all') {
        if (filter === 'foundation') {
          filteredQuestions = filteredQuestions.filter(q => q.difficulty === 'Foundation');
        } else if (filter === 'higher') {
          filteredQuestions = filteredQuestions.filter(q => q.difficulty === 'Higher');
        } else {
          filteredQuestions = filteredQuestions.filter(q => 
            q.examBoard.toLowerCase().includes(filter.toLowerCase())
          );
        }
      }

      // Apply sorting (already sorted by date from getUserProgress, but re-sort if needed)
      const sortedQuestions = [...filteredQuestions].sort((a, b) => {
        switch (sortBy) {
          case 'date':
            return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
          case 'marks':
            return b.marks - a.marks;
          case 'difficulty':
            return a.difficulty.localeCompare(b.difficulty);
          default:
            return 0;
        }
      });

      return sortedQuestions;
    } catch (error) {
      console.error('Error getting filtered progress:', error);
      throw error;
    }
  }
}

export const progressService = new ProgressService();
