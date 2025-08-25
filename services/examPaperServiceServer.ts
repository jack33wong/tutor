import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit, where, addDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';

// Server-side Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase for server-side use
let app: any = null;
let db: any = null;

function initializeServerFirebase() {
  if (!app) {
    try {
      // Check if Firebase is already initialized
      if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
        console.log('🔥 Server-side Firebase initialized');
      } else {
        app = getApps()[0];
        console.log('🔥 Server-side Firebase already initialized');
      }
      
      // Initialize Firestore
      db = getFirestore(app);
      console.log('🗄️ Server-side Firestore initialized successfully');
    } catch (error) {
      console.error('❌ Server-side Firebase initialization failed:', error);
      throw error;
    }
  }
}

// Initialize immediately for server-side use
initializeServerFirebase();

export interface ExamQuestionMetadata {
  id: string;
  question: string;
  examBoard: string;
  year: number;
  paper: string;
  level: 'GCSE' | 'A-Level';
  questionNumber: string;
  topic: string;
  difficulty: 'Foundation' | 'Higher';
  marks: number;
  category: string;
}

export class ExamPaperServiceServer {
  private readonly FULL_EXAM_PAPERS_COLLECTION = 'fullExamPapers';
  private readonly EXAM_PAPERS_COLLECTION = 'examPapers';
  private readonly PAST_EXAM_QUESTIONS_COLLECTION = 'pastExamQuestions';

  private checkFirestore() {
    if (!db) {
      throw new Error('Firestore not initialized on server side');
    }
  }

  /**
   * Detect if a question matches any exam question in the database using text similarity
   */
  async detectExamQuestion(questionText: string): Promise<ExamQuestionMetadata | null> {
    try {
      this.checkFirestore();
      
      console.log('🔍 Detecting exam question on server side:', questionText.substring(0, 100) + '...');
      
      // Get all past exam questions from Firestore
      const questionsSnapshot = await getDocs(collection(db, this.PAST_EXAM_QUESTIONS_COLLECTION));
      const questions = questionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[]; // Type as any to handle dynamic Firestore data

      console.log(`📚 Found ${questions.length} questions in database for comparison`);

      if (questions.length === 0) {
        console.log('❌ No questions found in database');
        return null;
      }

      // Normalize the input question
      const normalizedQuestion = this.normalizeText(questionText);
      
      let bestMatch: any = null;
      let bestSimilarity = 0;
      const SIMILARITY_THRESHOLD = 0.05; // 5% similarity threshold (reasonable for exam question detection)

      // Check each question for similarity
      for (const question of questions) {
        // Ensure the question has the required properties
        if (!question.question) {
          console.log('⚠️ Skipping question without text:', question.id);
          continue;
        }
        
        const normalizedDBQuestion = this.normalizeText(question.question);
        
        // Calculate similarity
        const similarity = this.calculateSimilarity(normalizedQuestion, normalizedDBQuestion);
        
        // Debug: Show all questions and their similarity scores
        console.log(`🔍 Comparing with: "${question.question.substring(0, 100)}..." (similarity: ${similarity.toFixed(4)})`);
        
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = question;
        }

        // Early exit if we find a very close match
        if (similarity > 0.9) {
          break;
        }
      }

      console.log(`🎯 Best similarity score: ${bestSimilarity.toFixed(3)} (threshold: ${SIMILARITY_THRESHOLD})`);

      // Return match if similarity is above threshold
      if (bestSimilarity >= SIMILARITY_THRESHOLD && bestMatch) {
        console.log('✅ Exam question detected:', bestMatch.examBoard, bestMatch.year, bestMatch.paper);
        
        return {
          id: bestMatch.id || '',
          question: bestMatch.question,
          category: bestMatch.category || 'General',
          examBoard: bestMatch.examBoard,
          year: bestMatch.year,
          paper: bestMatch.paper,
          level: bestMatch.level || 'GCSE',
          questionNumber: bestMatch.questionNumber,
          topic: bestMatch.topic,
          difficulty: bestMatch.difficulty,
          marks: bestMatch.marks
        };
      }
      
      console.log('❌ No matching exam question found');
      return null;
      
    } catch (error) {
      console.error('❌ Error detecting exam question on server side:', error);
      return null;
    }
  }

  /**
   * Format exam metadata for display
   */
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

  /**
   * Get random exam questions from Firestore
   */
  async getRandomExamQuestions(count: number = 1): Promise<any[]> {
    try {
      this.checkFirestore();
      
      console.log(`🎲 Getting ${count} random exam questions from server-side Firestore...`);
      
      // Get all questions and randomly select
      const questionsSnapshot = await getDocs(collection(db, this.PAST_EXAM_QUESTIONS_COLLECTION));
      const questions = questionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[]; // Type as any to handle dynamic Firestore data

      if (questions.length === 0) {
        console.log('❌ No questions found in database');
        return [];
      }

      // Shuffle and select random questions
      const shuffled = questions.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(count, questions.length));
      
      console.log(`✅ Selected ${selected.length} random questions`);
      return selected;
      
    } catch (error) {
      console.error('❌ Error getting random questions from server-side Firestore:', error);
      return [];
    }
  }

  /**
   * Normalize text for comparison (remove punctuation, convert to lowercase, etc.)
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Calculate similarity between two texts using improved matching
   */
  private calculateSimilarity(text1: string, text2: string): number {
    if (text1 === text2) return 1.0;
    if (text1.length === 0 || text2.length === 0) return 0.0;

    const longer = text1.length > text2.length ? text1 : text2;
    const shorter = text1.length > text2.length ? text2 : text1;

    if (longer.length === 0) return 1.0;

    // Check if one text contains the other (exact substring match)
    if (longer.includes(shorter)) {
      return shorter.length / longer.length;
    }

    // Check for key word matches (more flexible)
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    let wordMatches = 0;
    let totalWords = Math.max(words1.length, words2.length);
    
    for (const word1 of words1) {
      if (word1.length > 3) { // Only consider words longer than 3 characters
        for (const word2 of words2) {
          if (word2.length > 3) {
            // Check if words are similar (allowing for minor differences)
            if (word1 === word2 || 
                word1.includes(word2) || 
                word2.includes(word1) ||
                this.levenshteinDistance(word1, word2) <= 2) {
              wordMatches++;
              break;
            }
          }
        }
      }
    }
    
    // Calculate word-based similarity
    const wordSimilarity = wordMatches / totalWords;
    
    // Also calculate character-based similarity as fallback
    let charMatches = 0;
    const minLength = Math.min(text1.length, text2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (text1[i] === text2[i]) {
        charMatches++;
      }
    }
    
    const charSimilarity = charMatches / Math.max(text1.length, text2.length);
    
    // Return the higher of the two similarity scores
    return Math.max(wordSimilarity, charSimilarity);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

// Create and export a singleton instance
export const examPaperServiceServer = new ExamPaperServiceServer();
export default examPaperServiceServer;
