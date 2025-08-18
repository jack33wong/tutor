export interface UserProgress {
  userId: string;
  topics: TopicProgress[];
  examAttempts: ExamAttempt[];
  studySessions: StudySession[];
  overallProgress: number;
  targetGrade: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
  currentLevel: 'foundation' | 'higher';
}

export interface TopicProgress {
  topicId: string;
  subtopicProgress: SubtopicProgress[];
  completed: boolean;
  completionPercentage: number;
  lastStudied: Date;
  timeSpent: number; // in minutes
}

export interface SubtopicProgress {
  subtopicId: string;
  completed: boolean;
  masteryLevel: 'not-started' | 'beginner' | 'intermediate' | 'mastered';
  timeSpent: number; // in minutes
  lastPracticed: Date;
  practiceQuestions: PracticeQuestionResult[];
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
  topics: string[];
  subtopics: string[];
  sessionType: 'learning' | 'practice' | 'revision' | 'exam';
  notes?: string;
}

// Sample user progress data
export const sampleUserProgress: UserProgress = {
  userId: 'user123',
  targetGrade: '7',
  currentLevel: 'foundation',
  overallProgress: 35,
  topics: [
    {
      topicId: 'number',
      completed: true,
      completionPercentage: 100,
      lastStudied: new Date('2024-01-15'),
      timeSpent: 1200,
      subtopicProgress: [
        {
          subtopicId: 'number-basic',
          completed: true,
          masteryLevel: 'mastered',
          timeSpent: 400,
          lastPracticed: new Date('2024-01-15'),
          practiceQuestions: [
            {
              questionId: 'q1',
              correct: true,
              timeSpent: 45,
              date: new Date('2024-01-15'),
              attempts: 1
            }
          ]
        },
        {
          subtopicId: 'number-fractions',
          completed: true,
          masteryLevel: 'mastered',
          timeSpent: 500,
          lastPracticed: new Date('2024-01-14'),
          practiceQuestions: []
        },
        {
          subtopicId: 'number-ratio',
          completed: true,
          masteryLevel: 'intermediate',
          timeSpent: 300,
          lastPracticed: new Date('2024-01-13'),
          practiceQuestions: []
        }
      ]
    },
    {
      topicId: 'algebra',
      completed: false,
      completionPercentage: 60,
      lastStudied: new Date('2024-01-16'),
      timeSpent: 900,
      subtopicProgress: [
        {
          subtopicId: 'algebra-expressions',
          completed: true,
          masteryLevel: 'intermediate',
          timeSpent: 400,
          lastPracticed: new Date('2024-01-16'),
          practiceQuestions: []
        },
        {
          subtopicId: 'algebra-equations',
          completed: false,
          masteryLevel: 'beginner',
          timeSpent: 300,
          lastPracticed: new Date('2024-01-15'),
          practiceQuestions: []
        },
        {
          subtopicId: 'algebra-sequences',
          completed: false,
          masteryLevel: 'not-started',
          timeSpent: 0,
          lastPracticed: new Date('2024-01-10'),
          practiceQuestions: []
        }
      ]
    },
    {
      topicId: 'geometry',
      completed: false,
      completionPercentage: 30,
      lastStudied: new Date('2024-01-12'),
      timeSpent: 600,
      subtopicProgress: [
        {
          subtopicId: 'geometry-angles',
          completed: true,
          masteryLevel: 'intermediate',
          timeSpent: 400,
          lastPracticed: new Date('2024-01-12'),
          practiceQuestions: []
        },
        {
          subtopicId: 'geometry-area',
          completed: false,
          masteryLevel: 'beginner',
          timeSpent: 200,
          lastPracticed: new Date('2024-01-11'),
          practiceQuestions: []
        },
        {
          subtopicId: 'geometry-volume',
          completed: false,
          masteryLevel: 'not-started',
          timeSpent: 0,
          lastPracticed: new Date('2024-01-10'),
          practiceQuestions: []
        }
      ]
    }
  ],
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
      topics: ['algebra'],
      subtopics: ['algebra-equations'],
      sessionType: 'learning',
      notes: 'Focused on solving linear equations with brackets'
    },
    {
      id: 'session2',
      date: new Date('2024-01-15'),
      duration: 120,
      topics: ['number', 'algebra'],
      subtopics: ['number-ratio', 'algebra-expressions'],
      sessionType: 'practice',
      notes: 'Mixed practice on ratios and algebraic expressions'
    }
  ]
};
