export interface ExamQuestion {
  id: string;
  question: string;
  marks: number;
  topic: string;
  subtopic: string;
  difficulty: 'foundation' | 'higher';
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  working?: string;
}

export interface ExamPaper {
  id: string;
  title: string;
  year: number;
  difficulty: 'foundation' | 'higher';
  totalMarks: number;
  timeLimit: number; // in minutes
  questions: ExamQuestion[];
}

export const examPapers: ExamPaper[] = [
  {
    id: 'paper-1-foundation-2023',
    title: 'GCSE Maths Foundation Paper 1 (Calculator)',
    year: 2023,
    difficulty: 'foundation',
    totalMarks: 80,
    timeLimit: 90,
    questions: [
      {
        id: 'q1',
        question: 'Calculate 3.2 × 4.5',
        marks: 2,
        topic: 'number',
        subtopic: 'number-basic',
        difficulty: 'foundation',
        correctAnswer: 14.4,
        explanation: '3.2 × 4.5 = 14.4. You can use the grid method or long multiplication.',
        working: '3.2 × 4.5 = 14.4'
      },
      {
        id: 'q2',
        question: 'Write 0.75 as a fraction in its simplest form',
        marks: 2,
        topic: 'number',
        subtopic: 'number-fractions',
        difficulty: 'foundation',
        correctAnswer: '3/4',
        explanation: '0.75 = 75/100 = 3/4 (dividing numerator and denominator by 25)',
        working: '0.75 = 75/100 = 3/4'
      },
      {
        id: 'q3',
        question: 'Simplify 3x + 2y + 5x - y',
        marks: 2,
        topic: 'algebra',
        subtopic: 'algebra-expressions',
        difficulty: 'foundation',
        correctAnswer: '8x + y',
        explanation: 'Collect like terms: 3x + 5x = 8x and 2y - y = y',
        working: '3x + 2y + 5x - y = 8x + y'
      },
      {
        id: 'q4',
        question: 'Solve the equation 2x + 3 = 11',
        marks: 2,
        topic: 'algebra',
        subtopic: 'algebra-equations',
        difficulty: 'foundation',
        correctAnswer: 4,
        explanation: 'Subtract 3 from both sides: 2x = 8, then divide by 2: x = 4',
        working: '2x + 3 = 11\n2x = 8\nx = 4'
      },
      {
        id: 'q5',
        question: 'Find the area of a rectangle with length 6cm and width 4cm',
        marks: 2,
        topic: 'geometry',
        subtopic: 'geometry-area',
        difficulty: 'foundation',
        correctAnswer: 24,
        explanation: 'Area = length × width = 6 × 4 = 24 cm²',
        working: 'Area = 6 × 4 = 24 cm²'
      },
      {
        id: 'q6',
        question: 'Calculate 15% of £80',
        marks: 2,
        topic: 'number',
        subtopic: 'number-fractions',
        difficulty: 'foundation',
        correctAnswer: 12,
        explanation: '15% = 0.15, so 0.15 × 80 = 12',
        working: '15% of £80 = 0.15 × 80 = £12'
      },
      {
        id: 'q7',
        question: 'What is the probability of rolling a 6 on a fair dice?',
        marks: 1,
        topic: 'statistics',
        subtopic: 'statistics-probability',
        difficulty: 'foundation',
        correctAnswer: '1/6',
        explanation: 'There is 1 outcome (6) out of 6 possible outcomes',
        working: 'P(6) = 1/6'
      },
      {
        id: 'q8',
        question: 'Find the next term in the sequence: 2, 5, 8, 11, ...',
        marks: 2,
        topic: 'algebra',
        subtopic: 'algebra-sequences',
        difficulty: 'foundation',
        correctAnswer: 14,
        explanation: 'The sequence increases by 3 each time. 11 + 3 = 14',
        working: 'Common difference = 3\nNext term = 11 + 3 = 14'
      }
    ]
  },
  {
    id: 'paper-1-higher-2023',
    title: 'GCSE Maths Higher Paper 1 (Calculator)',
    year: 2023,
    difficulty: 'higher',
    totalMarks: 80,
    timeLimit: 90,
    questions: [
      {
        id: 'hq1',
        question: 'Solve x² + 5x + 6 = 0',
        marks: 3,
        topic: 'higher-algebra',
        subtopic: 'higher-quadratics',
        difficulty: 'higher',
        correctAnswer: 'x = -2 or x = -3',
        explanation: 'Factorise: (x + 2)(x + 3) = 0, so x = -2 or x = -3',
        working: 'x² + 5x + 6 = 0\n(x + 2)(x + 3) = 0\nx = -2 or x = -3'
      },
      {
        id: 'hq2',
        question: 'Find the gradient of the line y = 3x - 2',
        marks: 1,
        topic: 'higher-algebra',
        subtopic: 'higher-graphs',
        difficulty: 'higher',
        correctAnswer: 3,
        explanation: 'In the form y = mx + c, the gradient is m = 3',
        working: 'y = 3x - 2\nGradient = 3'
      },
      {
        id: 'hq3',
        question: 'Calculate sin(30°)',
        marks: 1,
        topic: 'higher-geometry',
        subtopic: 'higher-trigonometry',
        difficulty: 'higher',
        correctAnswer: 0.5,
        explanation: 'sin(30°) = 0.5 (exact value)',
        working: 'sin(30°) = 0.5'
      },
      {
        id: 'hq4',
        question: 'Find the area of a triangle with sides 5cm, 12cm and 13cm',
        marks: 3,
        topic: 'higher-geometry',
        subtopic: 'higher-trigonometry',
        difficulty: 'higher',
        correctAnswer: 30,
        explanation: 'This is a right-angled triangle (5² + 12² = 13²). Area = ½ × 5 × 12 = 30 cm²',
        working: '5² + 12² = 25 + 144 = 169 = 13²\nArea = ½ × 5 × 12 = 30 cm²'
      },
      {
        id: 'hq5',
        question: 'Solve the simultaneous equations: 2x + y = 7 and x - y = 2',
        marks: 3,
        topic: 'algebra',
        subtopic: 'algebra-equations',
        difficulty: 'higher',
        correctAnswer: 'x = 3, y = 1',
        explanation: 'Add the equations: 3x = 9, so x = 3. Substitute: 3 - y = 2, so y = 1',
        working: '2x + y = 7\nx - y = 2\nAdding: 3x = 9\nx = 3\n3 - y = 2\ny = 1'
      }
    ]
  }
];
