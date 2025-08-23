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
  status: 'asked' | 'wrong' | 'correct'; // New status field
  correctAnswer?: string; // Store the correct answer for validation
}

export interface ProgressStats {
  totalCompleted: number;
  byExamBoard: Record<string, number>;
  byYear: Record<number, number>;
  byCategory: Record<string, number>;
  byDifficulty: Record<string, number>;
  byTopic: Record<string, number>;
  completionRate: number; // percentage of available questions completed
}

export interface UserProgress {
  completedQuestions: CompletedQuestion[];
  stats: ProgressStats;
  lastUpdated: Date;
}

// Function to calculate progress statistics
export function calculateProgressStats(completedQuestions: CompletedQuestion[]): ProgressStats {
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
  // This would be based on the total questions in pastExamQuestions.ts
  const totalAvailableQuestions = 18; // Update this when we add more questions
  stats.completionRate = Math.round((stats.totalCompleted / totalAvailableQuestions) * 100);

  return stats;
}

// Function to add a completed question with status
export function addCompletedQuestion(
  currentProgress: UserProgress,
  questionId: string,
  questionText: string,
  examBoard: string,
  year: number,
  paper: string,
  questionNumber: string,
  category: string,
  marks: number,
  difficulty: 'Foundation' | 'Higher',
  topic: string,
  sessionId?: string,
  userAnswer?: string,
  correctAnswer?: string
): UserProgress {
  // Check if question is already completed
  const existingQuestionIndex = currentProgress.completedQuestions.findIndex(
    q => q.questionId === questionId
  );

  let status: 'asked' | 'wrong' | 'correct' = 'asked';
  
  // Determine status based on user answer and correct answer
  if (userAnswer && correctAnswer) {
    // Simple answer validation - can be enhanced with more sophisticated logic
    const isCorrect = validateAnswer(userAnswer, correctAnswer);
    status = isCorrect ? 'correct' : 'wrong';
  }

  const newCompletedQuestion: CompletedQuestion = {
    questionId,
    questionText,
    examBoard,
    year,
    paper,
    questionNumber,
    category,
    marks,
    difficulty,
    topic,
    completedAt: new Date(),
    userAnswer,
    sessionId,
    status,
    correctAnswer
  };

  let updatedQuestions;
  
  if (existingQuestionIndex >= 0) {
    // Update existing question
    updatedQuestions = [...currentProgress.completedQuestions];
    updatedQuestions[existingQuestionIndex] = newCompletedQuestion;
  } else {
    // Add new question
    updatedQuestions = [...currentProgress.completedQuestions, newCompletedQuestion];
  }

  const updatedStats = calculateProgressStats(updatedQuestions);

  return {
    completedQuestions: updatedQuestions,
    stats: updatedStats,
    lastUpdated: new Date()
  };
}

// Function to validate user answer against correct answer
function validateAnswer(userAnswer: string, correctAnswer: string): boolean {
  // Normalize both answers for comparison
  const normalize = (answer: string): string => {
    return answer
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s\-\.]/g, ''); // Remove special characters except spaces, hyphens, and dots
  };

  const normalizedUser = normalize(userAnswer);
  const normalizedCorrect = normalize(correctAnswer);

  // Direct match
  if (normalizedUser === normalizedCorrect) {
    return true;
  }

  // Try to parse as numbers for numerical answers
  const userNum = parseFloat(normalizedUser);
  const correctNum = parseFloat(normalizedCorrect);
  
  if (!isNaN(userNum) && !isNaN(correctNum)) {
    // Allow for small floating point differences
    return Math.abs(userNum - correctNum) < 0.001;
  }

  // Check if user answer contains the correct answer (for partial matches)
  if (normalizedUser.includes(normalizedCorrect) || normalizedCorrect.includes(normalizedUser)) {
    return true;
  }

  return false;
}

// Function to update question status when user provides an answer
export function updateQuestionStatus(
  currentProgress: UserProgress,
  questionId: string,
  userAnswer: string,
  correctAnswer: string
): UserProgress {
  const questionIndex = currentProgress.completedQuestions.findIndex(
    q => q.questionId === questionId
  );

  if (questionIndex === -1) {
    console.log('Question not found for status update:', questionId);
    return currentProgress;
  }

  const question = currentProgress.completedQuestions[questionIndex];
  const isCorrect = validateAnswer(userAnswer, correctAnswer);
  
  const updatedQuestion: CompletedQuestion = {
    ...question,
    userAnswer,
    correctAnswer,
    status: isCorrect ? 'correct' : 'wrong',
    completedAt: new Date() // Update timestamp when answer is provided
  };

  const updatedQuestions = [...currentProgress.completedQuestions];
  updatedQuestions[questionIndex] = updatedQuestion;

  const updatedStats = calculateProgressStats(updatedQuestions);

  return {
    completedQuestions: updatedQuestions,
    stats: updatedStats,
    lastUpdated: new Date()
  };
}

// Function to get question status for display
export function getQuestionStatus(question: CompletedQuestion): string {
  switch (question.status) {
    case 'asked':
      return '❓ Asked';
    case 'wrong':
      return '❌ Wrong';
    case 'correct':
      return '✅ Correct';
    default:
      return '❓ Unknown';
  }
}

// Function to get completion status for display (updated)
export function getCompletionStatus(progress: UserProgress, questionId: string): string {
  const question = progress.completedQuestions.find(q => q.questionId === questionId);
  
  if (!question) {
    return "";
  }
  
  const isRecent = wasCompletedRecently(progress, questionId);
  const completedDate = new Date(question.completedAt).toLocaleDateString();
  const statusText = getQuestionStatus(question);
  
  return `${statusText} ${isRecent ? '(Recently)' : `on ${completedDate}`}`;
}

// Function to get progress summary for display
export function getProgressSummary(progress: UserProgress): string {
  const { stats } = progress;
  
  if (stats.totalCompleted === 0) {
    return "No past paper questions completed yet. Start practicing to track your progress!";
  }

  const examBoards = Object.keys(stats.byExamBoard).join(', ');
  const topCategory = Object.entries(stats.byCategory)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

  return `📊 **Progress Summary:**
  
**Total Questions Completed:** ${stats.totalCompleted}
**Completion Rate:** ${stats.completionRate}%
**Exam Boards:** ${examBoards}
**Most Practiced Category:** ${topCategory} (${stats.byCategory[topCategory] || 0} questions)
**Foundation:** ${stats.byDifficulty['Foundation'] || 0} | **Higher:** ${stats.byDifficulty['Higher'] || 0}`;
}

// Function to check if a question was completed recently (within last 24 hours)
export function wasCompletedRecently(progress: UserProgress, questionId: string): boolean {
  const question = progress.completedQuestions.find(q => q.questionId === questionId);
  if (!question) return false;
  
  const now = new Date();
  const completedAt = new Date(question.completedAt);
  const hoursDiff = (now.getTime() - completedAt.getTime()) / (1000 * 60 * 60);
  
  return hoursDiff < 24;
}

// Function to remove a completed question
export function removeCompletedQuestion(
  currentProgress: UserProgress,
  questionId: string
): UserProgress {
  const updatedQuestions = currentProgress.completedQuestions.filter(
    q => q.questionId !== questionId
  );
  
  return {
    ...currentProgress,
    completedQuestions: updatedQuestions,
    stats: calculateProgressStats(updatedQuestions),
    lastUpdated: new Date()
  };
}

