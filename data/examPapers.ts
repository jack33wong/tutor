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
  id: string;
  title: string;
  year: number;
  difficulty: 'foundation' | 'higher';
  totalMarks: number;
  timeLimit: number; // in minutes
  questions: ExamQuestion[];
  examBoard: 'AQA' | 'Edexcel' | 'OCR' | 'WJEC';
  paperType: 'Paper 1' | 'Paper 2' | 'Paper 3';
  calculator: boolean;
}

export const examPapers: ExamPaper[] = [
  {
    id: 'paper-1-foundation-2023',
    title: 'GCSE Maths Foundation Paper 1 (Non-Calculator)',
    year: 2023,
    difficulty: 'foundation',
    totalMarks: 80,
    timeLimit: 90,
    examBoard: 'AQA',
    paperType: 'Paper 1',
    calculator: false,
    questions: [
      {
        id: 'q1',
        question: 'Calculate 3.2 × 4.5',
        marks: 2,
        topic: 'number',
        subtopic: 'number-basic',
        difficulty: 'foundation',
        questionType: 'short-answer',
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
        questionType: 'short-answer',
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
        questionType: 'short-answer',
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
        questionType: 'short-answer',
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
        questionType: 'short-answer',
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
        questionType: 'short-answer',
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
        questionType: 'multiple-choice',
        options: ['1/6', '1/5', '1/4', '1/3'],
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
        questionType: 'short-answer',
        correctAnswer: 14,
        explanation: 'The sequence increases by 3 each time. 11 + 3 = 14',
        working: 'Common difference = 3\nNext term = 11 + 3 = 14'
      }
    ]
  },
  {
    id: 'paper-2-foundation-2023',
    title: 'GCSE Maths Foundation Paper 2 (Calculator)',
    year: 2023,
    difficulty: 'foundation',
    totalMarks: 80,
    timeLimit: 90,
    examBoard: 'AQA',
    paperType: 'Paper 2',
    calculator: true,
    questions: [
      {
        id: 'q1',
        question: 'Calculate 127.8 ÷ 3.2, giving your answer to 2 decimal places',
        marks: 3,
        topic: 'number',
        subtopic: 'number-basic',
        difficulty: 'foundation',
        questionType: 'short-answer',
        correctAnswer: 39.94,
        explanation: '127.8 ÷ 3.2 = 39.9375... ≈ 39.94 (to 2 d.p.)',
        working: '127.8 ÷ 3.2 = 39.9375...\n= 39.94 (to 2 d.p.)'
      },
      {
        id: 'q2',
        question: 'A car travels 180 miles in 3 hours. What is its average speed in miles per hour?',
        marks: 2,
        topic: 'number',
        subtopic: 'number-ratio',
        difficulty: 'foundation',
        questionType: 'short-answer',
        correctAnswer: 60,
        explanation: 'Speed = distance ÷ time = 180 ÷ 3 = 60 mph',
        working: 'Speed = 180 ÷ 3 = 60 mph'
      },
      {
        id: 'q3',
        question: 'Solve the inequality 3x - 2 < 10',
        marks: 2,
        topic: 'algebra',
        subtopic: 'algebra-equations',
        difficulty: 'foundation',
        questionType: 'short-answer',
        correctAnswer: 'x < 4',
        explanation: 'Add 2 to both sides: 3x < 12, then divide by 3: x < 4',
        working: '3x - 2 < 10\n3x < 12\nx < 4'
      },
      {
        id: 'q4',
        question: 'Find the volume of a cuboid with dimensions 5cm × 3cm × 4cm',
        marks: 2,
        topic: 'geometry',
        subtopic: 'geometry-volume',
        difficulty: 'foundation',
        questionType: 'short-answer',
        correctAnswer: 60,
        explanation: 'Volume = length × width × height = 5 × 3 × 4 = 60 cm³',
        working: 'Volume = 5 × 3 × 4 = 60 cm³'
      },
      {
        id: 'q5',
        question: 'Calculate the mean of the numbers: 12, 15, 18, 20, 25',
        marks: 2,
        topic: 'statistics',
        subtopic: 'statistics-data',
        difficulty: 'foundation',
        questionType: 'short-answer',
        correctAnswer: 18,
        explanation: 'Mean = sum ÷ count = (12+15+18+20+25) ÷ 5 = 90 ÷ 5 = 18',
        working: 'Mean = (12+15+18+20+25) ÷ 5\n= 90 ÷ 5 = 18'
      }
    ]
  },
  {
    id: 'paper-1-higher-2023',
    title: 'GCSE Maths Higher Paper 1 (Non-Calculator)',
    year: 2023,
    difficulty: 'higher',
    totalMarks: 80,
    timeLimit: 90,
    examBoard: 'AQA',
    paperType: 'Paper 1',
    calculator: false,
    questions: [
      {
        id: 'hq1',
        question: 'Solve x² + 5x + 6 = 0',
        marks: 3,
        topic: 'higher-algebra',
        subtopic: 'higher-quadratics',
        difficulty: 'higher',
        questionType: 'short-answer',
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
        questionType: 'short-answer',
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
        questionType: 'short-answer',
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
        questionType: 'short-answer',
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
        questionType: 'short-answer',
        correctAnswer: 'x = 3, y = 1',
        explanation: 'Add the equations: 3x = 9, so x = 3. Substitute: 3 - y = 2, so y = 1',
        working: '2x + y = 7\nx - y = 2\nAdding: 3x = 9\nx = 3\n3 - y = 2\ny = 1'
      }
    ]
  },
  {
    id: 'paper-2-higher-2023',
    title: 'GCSE Maths Higher Paper 2 (Calculator)',
    year: 2023,
    difficulty: 'higher',
    totalMarks: 80,
    timeLimit: 90,
    examBoard: 'AQA',
    paperType: 'Paper 2',
    calculator: true,
    questions: [
      {
        id: 'hq6',
        question: 'Use the quadratic formula to solve 2x² - 7x + 3 = 0',
        marks: 4,
        topic: 'higher-algebra',
        subtopic: 'higher-quadratics',
        difficulty: 'higher',
        questionType: 'long-answer',
        correctAnswer: 'x = 3 or x = 0.5',
        explanation: 'Using x = (-b ± √(b² - 4ac)) / 2a where a=2, b=-7, c=3',
        working: 'x = (-(-7) ± √((-7)² - 4×2×3)) / (2×2)\nx = (7 ± √(49 - 24)) / 4\nx = (7 ± √25) / 4\nx = (7 ± 5) / 4\nx = 12/4 = 3 or x = 2/4 = 0.5'
      },
      {
        id: 'hq7',
        question: 'Find the equation of the line that passes through the points (2, 3) and (4, 7)',
        marks: 3,
        topic: 'higher-algebra',
        subtopic: 'higher-graphs',
        difficulty: 'higher',
        questionType: 'short-answer',
        correctAnswer: 'y = 2x - 1',
        explanation: 'Gradient = (7-3)/(4-2) = 4/2 = 2. Using y - y₁ = m(x - x₁) with point (2,3)',
        working: 'Gradient = (7-3)/(4-2) = 4/2 = 2\ny - 3 = 2(x - 2)\ny - 3 = 2x - 4\ny = 2x - 1'
      },
      {
        id: 'hq8',
        question: 'Calculate the area of a sector of a circle with radius 6cm and angle 60°',
        marks: 3,
        topic: 'higher-geometry',
        subtopic: 'higher-circles',
        difficulty: 'higher',
        questionType: 'short-answer',
        correctAnswer: 18.85,
        explanation: 'Area of sector = (θ/360) × πr² = (60/360) × π × 6² = (1/6) × π × 36 = 6π ≈ 18.85 cm²',
        working: 'Area = (60/360) × π × 6²\n= (1/6) × π × 36\n= 6π ≈ 18.85 cm²'
      }
    ]
  },
  {
    id: 'edexcel-foundation-2022',
    title: 'Edexcel GCSE Maths Foundation Paper 1 (Non-Calculator)',
    year: 2022,
    difficulty: 'foundation',
    totalMarks: 80,
    timeLimit: 90,
    examBoard: 'Edexcel',
    paperType: 'Paper 1',
    calculator: false,
    questions: [
      {
        id: 'eq1',
        question: 'Work out 15.6 + 8.9',
        marks: 2,
        topic: 'number',
        subtopic: 'number-basic',
        difficulty: 'foundation',
        questionType: 'short-answer',
        correctAnswer: 24.5,
        explanation: '15.6 + 8.9 = 24.5',
        working: '15.6 + 8.9 = 24.5'
      },
      {
        id: 'eq2',
        question: 'Write 0.8 as a fraction in its simplest form',
        marks: 2,
        topic: 'number',
        subtopic: 'number-fractions',
        difficulty: 'foundation',
        questionType: 'short-answer',
        correctAnswer: '4/5',
        explanation: '0.8 = 8/10 = 4/5 (dividing numerator and denominator by 2)',
        working: '0.8 = 8/10 = 4/5'
      },
      {
        id: 'eq3',
        question: 'Expand 2(x + 3)',
        marks: 2,
        topic: 'algebra',
        subtopic: 'algebra-expressions',
        difficulty: 'foundation',
        questionType: 'short-answer',
        correctAnswer: '2x + 6',
        explanation: 'Multiply each term inside the bracket by 2: 2 × x + 2 × 3 = 2x + 6',
        working: '2(x + 3) = 2 × x + 2 × 3 = 2x + 6'
      }
    ]
  },
  {
    id: 'ocr-higher-2022',
    title: 'OCR GCSE Maths Higher Paper 1 (Non-Calculator)',
    year: 2022,
    difficulty: 'higher',
    totalMarks: 80,
    timeLimit: 90,
    examBoard: 'OCR',
    paperType: 'Paper 1',
    calculator: false,
    questions: [
      {
        id: 'oq1',
        question: 'Factorise x² - 9',
        marks: 2,
        topic: 'higher-algebra',
        subtopic: 'higher-quadratics',
        difficulty: 'higher',
        questionType: 'short-answer',
        correctAnswer: '(x + 3)(x - 3)',
        explanation: 'This is a difference of two squares: x² - 9 = x² - 3² = (x + 3)(x - 3)',
        working: 'x² - 9 = x² - 3² = (x + 3)(x - 3)'
      },
      {
        id: 'oq2',
        question: 'Find the value of x when 3x + 4 = 2x + 7',
        marks: 2,
        topic: 'algebra',
        subtopic: 'algebra-equations',
        difficulty: 'higher',
        questionType: 'short-answer',
        correctAnswer: 3,
        explanation: 'Subtract 2x from both sides: x + 4 = 7, then subtract 4: x = 3',
        working: '3x + 4 = 2x + 7\nx + 4 = 7\nx = 3'
      }
    ]
  }
];
