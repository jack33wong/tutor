import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db, initializeFirebase } from '@/config/firebase';

export interface FullExamQuestion {
  id: string;
  questionNumber: string;
  question: string;
  marks: number;
  category: string;
  topic: string;
  difficulty: 'Foundation' | 'Higher';
  answer?: string;
  working?: string;
}

export interface FullExamPaper {
  id?: string; // Optional for new papers, will be set by Firestore
  examBoard: string;
  year: number;
  paper: string;
  level: 'GCSE' | 'A-Level';
  difficulty: 'Foundation' | 'Higher';
  totalMarks: number;
  questions: FullExamQuestion[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ExamQuestionMetadata {
  id: string;
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

export interface ExamQuestion {
  id: string;
  question: string;
  marks: number;
  topic: string;
  subtopic: string;
  difficulty: 'foundation' | 'higher';
  questionType: 'multiple-choice' | 'short-answer' | 'long-answer' | 'problem-solving';
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  working?: string;
  imageUrl?: string;
  hints?: string[];
}

export interface ExamPaper {
  id?: string;
  title: string;
  year: number;
  level: 'GCSE' | 'A-Level';
  difficulty: 'foundation' | 'higher';
  totalMarks: number;
  timeLimit: number;
  questions: ExamQuestion[];
  examBoard: 'AQA' | 'Edexcel' | 'OCR' | 'WJEC';
  paperType: 'Paper 1' | 'Paper 2' | 'Paper 3';
  calculator: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

class ExamPaperService {
  private readonly FULL_EXAM_PAPERS_COLLECTION = 'fullExamPapers';
  private readonly EXAM_PAPERS_COLLECTION = 'examPapers';
  private readonly PAST_EXAM_QUESTIONS_COLLECTION = 'pastExamQuestions';

  // Check if Firestore is available
  private async checkFirestore(): Promise<void> {
    try {
      if (!db) {
        // Try to initialize Firebase if not already done
        if (typeof window !== 'undefined') {
          initializeFirebase();
        } else {
          throw new Error('Firestore not initialized. This function can only run on the client side.');
        }
      }
    } catch (error) {
      console.error('Error checking Firestore:', error);
      throw new Error('Firestore not initialized. This function can only run on the client side.');
    }
  }

  // Get all full exam papers
  async getAllFullExamPapers(): Promise<FullExamPaper[]> {
    await this.checkFirestore();
    
    try {
      // Get all documents without ordering to avoid index requirements
      const q = query(collection(db, this.FULL_EXAM_PAPERS_COLLECTION));
      
      const snapshot = await getDocs(q);
      const examPapers: FullExamPaper[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        examPapers.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as FullExamPaper);
      });
      
      // Sort in memory instead of in the query
      examPapers.sort((a, b) => {
        // First sort by year (descending)
        if (b.year !== a.year) {
          return b.year - a.year;
        }
        // Then sort by exam board (ascending)
        return a.examBoard.localeCompare(b.examBoard);
      });
      
      return examPapers;
    } catch (error) {
      console.error('Error getting all full exam papers:', error);
      throw error;
    }
  }

  // Get full exam paper by ID
  async getFullExamPaperById(paperId: string): Promise<FullExamPaper | null> {
    await this.checkFirestore();
    
    try {
      const docRef = doc(db, this.FULL_EXAM_PAPERS_COLLECTION, paperId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as FullExamPaper;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting full exam paper by ID:', error);
      throw error;
    }
  }

  // Get full exam paper by exam board, year, and paper
  async getFullExamPaperByMetadata(
    examBoard: string, 
    year: number, 
    paper: string
  ): Promise<FullExamPaper | null> {
    await this.checkFirestore();
    
    try {
      const q = query(
        collection(db, this.FULL_EXAM_PAPERS_COLLECTION),
        where('examBoard', '==', examBoard),
        where('year', '==', year),
        where('paper', '==', paper)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as FullExamPaper;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting full exam paper by metadata:', error);
      throw error;
    }
  }

  // Get all exam papers
  async getAllExamPapers(): Promise<ExamPaper[]> {
    await this.checkFirestore();
    
    try {
      // Get all documents without ordering to avoid index requirements
      const q = query(collection(db, this.EXAM_PAPERS_COLLECTION));
      
      const snapshot = await getDocs(q);
      const examPapers: ExamPaper[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        examPapers.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as ExamPaper);
      });
      
      // Sort in memory instead of in the query
      examPapers.sort((a, b) => {
        // First sort by year (descending)
        if (b.year !== a.year) {
          return b.year - a.year;
        }
        // Then sort by exam board (ascending)
        return a.examBoard.localeCompare(b.examBoard);
      });
      
      return examPapers;
    } catch (error) {
      console.error('Error getting all exam papers:', error);
      throw error;
    }
  }

  // Get all past exam questions
  async getAllPastExamQuestions(): Promise<ExamQuestionMetadata[]> {
    await this.checkFirestore();
    
    try {
      // Get all documents without ordering to avoid index requirements
      const q = query(collection(db, this.PAST_EXAM_QUESTIONS_COLLECTION));
      
      const snapshot = await getDocs(q);
      const questions: ExamQuestionMetadata[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        questions.push({
          id: doc.id,
          ...data
        } as ExamQuestionMetadata);
      });
      
      // Sort in memory instead of in the query
      questions.sort((a, b) => {
        // First sort by year (descending)
        if (b.year !== a.year) {
          return b.year - a.year;
        }
        // Then sort by exam board (ascending)
        return a.examBoard.localeCompare(b.examBoard);
      });
      
      return questions;
    } catch (error) {
      console.error('Error getting all past exam questions:', error);
      throw error;
    }
  }

  // Get random exam questions
  async getRandomExamQuestions(count: number = 3): Promise<ExamQuestionMetadata[]> {
    await this.checkFirestore();
    
    try {
      // Get all questions and shuffle them
      const allQuestions = await this.getAllPastExamQuestions();
      const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    } catch (error) {
      console.error('Error getting random exam questions:', error);
      throw error;
    }
  }

  // Add a new full exam paper
  async addFullExamPaper(examPaper: Omit<FullExamPaper, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    await this.checkFirestore();
    
    try {
      const paperData = {
        ...examPaper,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, this.FULL_EXAM_PAPERS_COLLECTION), paperData);
      console.log('✅ Full exam paper added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding full exam paper:', error);
      throw error;
    }
  }

  // Add a new exam paper
  async addExamPaper(examPaper: Omit<ExamPaper, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    await this.checkFirestore();
    
    try {
      const paperData = {
        ...examPaper,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, this.EXAM_PAPERS_COLLECTION), paperData);
      console.log('✅ Exam paper added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding exam paper:', error);
      throw error;
    }
  }

  // Add a new past exam question
  async addPastExamQuestion(question: Omit<ExamQuestionMetadata, 'id'>): Promise<string> {
    await this.checkFirestore();
    
    try {
      const docRef = await addDoc(collection(db, this.PAST_EXAM_QUESTIONS_COLLECTION), question);
      console.log('✅ Past exam question added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding past exam question:', error);
      throw error;
    }
  }

  // Update an existing full exam paper
  async updateFullExamPaper(
    paperId: string, 
    updates: Partial<Omit<FullExamPaper, 'id' | 'createdAt'>>
  ): Promise<void> {
    await this.checkFirestore();
    
    try {
      const docRef = doc(db, this.FULL_EXAM_PAPERS_COLLECTION, paperId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
      console.log('✅ Full exam paper updated:', paperId);
    } catch (error) {
      console.error('Error updating full exam paper:', error);
      throw error;
    }
  }

  // Delete a full exam paper
  async deleteFullExamPaper(paperId: string): Promise<void> {
    await this.checkFirestore();
    
    try {
      const docRef = doc(db, this.FULL_EXAM_PAPERS_COLLECTION, paperId);
      await deleteDoc(docRef);
      console.log('✅ Full exam paper deleted:', paperId);
    } catch (error) {
      console.error('Error deleting full exam paper:', error);
      throw error;
    }
  }

  // Bulk import exam papers from static data
  // This method is deprecated - use database-only approach
  async bulkImportFromStaticData(): Promise<void> {
    throw new Error('Static data import is no longer supported. Please use database-only approach.');
  }

  // Check if exam papers exist in Firestore
  async hasExamPapers(): Promise<boolean> {
    await this.checkFirestore();
    
    try {
      const snapshot = await getDocs(collection(db, this.FULL_EXAM_PAPERS_COLLECTION));
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking if exam papers exist:', error);
      return false;
    }
  }

  // Exam question detection and formatting functions
  // These replace the static data functions that were deleted

  // Detect if a question matches any exam question in the database
  async detectExamQuestion(questionText: string): Promise<ExamQuestionMetadata | null> {
    try {
      const pastQuestions = await this.getAllPastExamQuestions();
      
      if (pastQuestions.length === 0) {
        return null;
      }

      // Simple text similarity check
      const normalizedQuestion = questionText.toLowerCase().replace(/[^\w\s]/g, '');
      
      for (const question of pastQuestions) {
        const normalizedDBQuestion = question.question.toLowerCase().replace(/[^\w\s]/g, '');
        
        // Check for exact match or high similarity
        if (normalizedQuestion === normalizedDBQuestion || 
            normalizedQuestion.includes(normalizedDBQuestion) || 
            normalizedDBQuestion.includes(normalizedQuestion)) {
          return {
            id: question.id || '',
            question: question.question,
            category: question.category || 'General',
            examBoard: question.examBoard,
            year: question.year,
            paper: question.paper,
            level: question.level || 'GCSE',
            questionNumber: question.questionNumber,
            topic: question.topic,
            difficulty: question.difficulty,
            marks: question.marks
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error detecting exam question:', error);
      return null;
    }
  }

  // Format exam metadata for display
  formatExamMetadata(metadata: ExamQuestionMetadata | null): string {
    if (!metadata) {
      return '';
    }
    
    return `📚 **Past Paper Question Detected!**
- **Level:** ${metadata.level}
- **Exam Board:** ${metadata.examBoard}
- **Year:** ${metadata.year}
- **Paper:** ${metadata.paper}
- **Question:** ${metadata.questionNumber}
- **Topic:** ${metadata.topic}
- **Difficulty:** ${metadata.difficulty}
- **Marks:** ${metadata.marks}`;
  }

  // Format suggested question for display
  formatSuggestedQuestion(metadata: ExamQuestionMetadata | null): string {
    if (!metadata) {
      return '';
    }
    
    return `💡 **Suggested Practice Question:**
- **Topic:** ${metadata.topic}
- **Difficulty:** ${metadata.difficulty}
- **Marks:** ${metadata.marks}`;
  }

  // Clear all exam papers from Firestore
  async clearAllExamPapers(): Promise<void> {
    await this.checkFirestore();
    
    try {
      console.log('🧹 Clearing all exam papers from Firestore...');
      
      // Clear full exam papers
      const fullExamPapersSnapshot = await getDocs(collection(db, this.FULL_EXAM_PAPERS_COLLECTION));
      const fullExamPapersBatch = writeBatch(db);
      fullExamPapersSnapshot.docs.forEach((doc) => {
        fullExamPapersBatch.delete(doc.ref);
      });
      await fullExamPapersBatch.commit();
      console.log(`🗑️ Deleted ${fullExamPapersSnapshot.size} full exam papers`);
      
      // Clear exam papers
      const examPapersSnapshot = await getDocs(collection(db, this.EXAM_PAPERS_COLLECTION));
      const examPapersBatch = writeBatch(db);
      examPapersSnapshot.docs.forEach((doc) => {
        examPapersBatch.delete(doc.ref);
      });
      await examPapersBatch.commit();
      console.log(`🗑️ Deleted ${examPapersSnapshot.size} exam papers`);
      
      // Clear past exam questions
      const pastExamQuestionsSnapshot = await getDocs(collection(db, this.PAST_EXAM_QUESTIONS_COLLECTION));
      const pastExamQuestionsBatch = writeBatch(db);
      pastExamQuestionsSnapshot.docs.forEach((doc) => {
        pastExamQuestionsBatch.delete(doc.ref);
      });
      await pastExamQuestionsBatch.commit();
      console.log(`🗑️ Deleted ${pastExamQuestionsSnapshot.size} past exam questions`);
      
      console.log('✅ All exam papers cleared from Firestore');
    } catch (error) {
      console.error('Error clearing exam papers:', error);
      throw error;
    }
  }
}

export const examPaperService = new ExamPaperService();
export default examPaperService;
