export interface UserProgress {
  userId: string;
  examAttempts: ExamAttempt[];
  studySessions: StudySession[];
  overallProgress: number;
  targetGrade: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
  currentLevel: 'foundation' | 'higher';
}

export interface PracticeQuestionResult {
  questionId: string;
  correct: boolean;
  timeSpent: number; // in seconds
  date: Date;
  attempts: number;
}

export interface ExamAttempt {
  examId: string;
  date: Date;
  score: number;
  totalMarks: number;
  percentage: number;
  timeSpent: number; // in minutes
  questionResults: ExamQuestionResult[];
  grade?: string;
}

export interface ExamQuestionResult {
  questionId: string;
  correct: boolean;
  marks: number;
  maxMarks: number;
  timeSpent: number; // in seconds
  userAnswer?: string;
}

export interface StudySession {
  id: string;
  date: Date;
  duration: number; // in minutes
  sessionType: 'learning' | 'practice' | 'revision' | 'exam';
  notes?: string;
}

// Sample user progress data
export const sampleUserProgress: UserProgress = {
  userId: 'user123',
  targetGrade: '7',
  currentLevel: 'foundation',
  overallProgress: 35,
  examAttempts: [
    {
      examId: 'paper-1-foundation-2023',
      date: new Date('2024-01-16'),
      score: 65,
      totalMarks: 80,
      percentage: 81.25,
      timeSpent: 85,
      grade: '7',
      questionResults: [
        {
          questionId: 'q1',
          correct: true,
          marks: 2,
          maxMarks: 2,
          timeSpent: 30
        },
        {
          questionId: 'q2',
          correct: true,
          marks: 2,
          maxMarks: 2,
          timeSpent: 45
        }
      ]
    }
  ],
  studySessions: [
    {
      id: 'session1',
      date: new Date('2024-01-16'),
      duration: 90,
      sessionType: 'learning',
      notes: 'Focused on solving linear equations with brackets'
    },
    {
      id: 'session2',
      date: new Date('2024-01-15'),
      duration: 120,
      sessionType: 'practice',
      notes: 'Mixed practice on ratios and algebraic expressions'
    }
  ]
};
