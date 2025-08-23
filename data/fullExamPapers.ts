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
  id: string;
  examBoard: string;
  year: number;
  paper: string;
  difficulty: 'Foundation' | 'Higher';
  totalMarks: number;
  questions: FullExamQuestion[];
}

// Full exam papers with all questions
export const fullExamPapers: FullExamPaper[] = [
  {
    id: "aqa-2023-1h",
    examBoard: "AQA",
    year: 2023,
    paper: "Paper 1H",
    difficulty: "Higher",
    totalMarks: 80,
    questions: [
      {
        id: "aqa-2023-1h-q1",
        questionNumber: "1",
        question: "Solve the equation 3x + 7 = 22",
        marks: 2,
        category: "Algebra",
        topic: "Linear Equations",
        difficulty: "Higher",
        answer: "x = 5",
        working: "3x + 7 = 22\n3x = 22 - 7\n3x = 15\nx = 15 ÷ 3\nx = 5"
      },
      {
        id: "aqa-2023-1h-q2",
        questionNumber: "2",
        question: "Calculate the value of 2³ × 3²",
        marks: 2,
        category: "Number",
        topic: "Indices",
        difficulty: "Higher",
        answer: "72",
        working: "2³ = 8\n3² = 9\n8 × 9 = 72"
      },
      {
        id: "aqa-2023-1h-q3",
        questionNumber: "3",
        question: "Simplify 4x + 3y - 2x + 5y",
        marks: 2,
        category: "Algebra",
        topic: "Simplifying Expressions",
        difficulty: "Higher",
        answer: "2x + 8y",
        working: "4x - 2x = 2x\n3y + 5y = 8y\n2x + 8y"
      },
      {
        id: "aqa-2023-1h-q4",
        questionNumber: "4",
        question: "Find the area of a rectangle with length 12cm and width 8cm",
        marks: 2,
        category: "Geometry",
        topic: "Area and Perimeter",
        difficulty: "Higher",
        answer: "96cm²",
        working: "Area = length × width\nArea = 12 × 8\nArea = 96cm²"
      },
      {
        id: "aqa-2023-1h-q5",
        questionNumber: "5",
        question: "Find the area of a triangle with base 8cm and height 6cm",
        marks: 2,
        category: "Geometry",
        topic: "Area and Perimeter",
        difficulty: "Higher",
        answer: "24cm²",
        working: "Area = ½ × base × height\nArea = ½ × 8 × 6\nArea = ½ × 48\nArea = 24cm²"
      }
    ]
  },
  {
    id: "edexcel-2022-1f",
    examBoard: "Edexcel",
    year: 2022,
    paper: "Paper 1F",
    difficulty: "Foundation",
    totalMarks: 80,
    questions: [
      {
        id: "edexcel-2022-1f-q1",
        questionNumber: "1",
        question: "Write 0.6 as a fraction in its simplest form",
        marks: 2,
        category: "Number",
        topic: "Fractions and Decimals",
        difficulty: "Foundation",
        answer: "3/5",
        working: "0.6 = 6/10\n6/10 = 3/5 (simplified)"
      },
      {
        id: "edexcel-2022-1f-q2",
        questionNumber: "2",
        question: "Calculate 15% of £120",
        marks: 2,
        category: "Number",
        topic: "Percentages",
        difficulty: "Foundation",
        answer: "£18",
        working: "15% = 15/100\n15/100 × 120 = 18\n£18"
      },
      {
        id: "edexcel-2022-1f-q3",
        questionNumber: "3",
        question: "Work out 3/4 + 1/8",
        marks: 3,
        category: "Number",
        topic: "Adding Fractions",
        difficulty: "Foundation",
        answer: "7/8",
        working: "3/4 = 6/8\n6/8 + 1/8 = 7/8"
      },
      {
        id: "edexcel-2022-1f-q4",
        questionNumber: "4",
        question: "Solve the equation 2x + 5 = 13",
        marks: 2,
        category: "Algebra",
        topic: "Linear Equations",
        difficulty: "Foundation",
        answer: "x = 4",
        working: "2x + 5 = 13\n2x = 13 - 5\n2x = 8\nx = 4"
      },
      {
        id: "edexcel-2022-1f-q5",
        questionNumber: "5",
        question: "Find the perimeter of a square with side length 7cm",
        marks: 2,
        category: "Geometry",
        topic: "Area and Perimeter",
        difficulty: "Foundation",
        answer: "28cm",
        working: "Perimeter = 4 × side length\nPerimeter = 4 × 7\nPerimeter = 28cm"
      }
    ]
  },
  {
    id: "edexcel-2022-2f",
    examBoard: "Edexcel",
    year: 2022,
    paper: "Paper 2F",
    difficulty: "Foundation",
    totalMarks: 80,
    questions: [
      {
        id: "edexcel-2022-2f-q1",
        questionNumber: "1",
        question: "Calculate 25% of 80",
        marks: 2,
        category: "Number",
        topic: "Percentages",
        difficulty: "Foundation",
        answer: "20",
        working: "25% = 25/100\n25/100 × 80 = 20"
      },
      {
        id: "edexcel-2022-2f-q2",
        questionNumber: "2",
        question: "Simplify 3x + 2y + x - y",
        marks: 2,
        category: "Algebra",
        topic: "Simplifying Expressions",
        difficulty: "Foundation",
        answer: "4x + y",
        working: "3x + x = 4x\n2y - y = y\n4x + y"
      },
      {
        id: "edexcel-2022-2f-q3",
        questionNumber: "3",
        question: "Find the area of a circle with radius 4cm",
        marks: 2,
        category: "Geometry",
        topic: "Area and Perimeter",
        difficulty: "Foundation",
        answer: "16π cm²",
        working: "Area = πr²\nArea = π × 4²\nArea = π × 16\nArea = 16π cm²"
      },
      {
        id: "edexcel-2022-2f-q4",
        questionNumber: "4",
        question: "Solve 5x - 3 = 12",
        marks: 2,
        category: "Algebra",
        topic: "Linear Equations",
        difficulty: "Foundation",
        answer: "x = 3",
        working: "5x - 3 = 12\n5x = 12 + 3\n5x = 15\nx = 3"
      },
      {
        id: "edexcel-2022-2f-q5",
        questionNumber: "5",
        question: "Work out 2/5 × 3/4",
        marks: 2,
        category: "Number",
        topic: "Multiplying Fractions",
        difficulty: "Foundation",
        answer: "3/10",
        working: "2/5 × 3/4 = (2×3)/(5×4)\n= 6/20\n= 3/10"
      },
      {
        id: "edexcel-2022-2f-q6",
        questionNumber: "6",
        question: "Solve the inequality 2x + 3 > 11",
        marks: 3,
        category: "Algebra",
        topic: "Inequalities",
        difficulty: "Foundation",
        answer: "x > 4",
        working: "2x + 3 > 11\n2x > 11 - 3\n2x > 8\nx > 4"
      }
    ]
  },
  {
    id: "ocr-2023-1f",
    examBoard: "OCR",
    year: 2023,
    paper: "Paper 1F",
    difficulty: "Foundation",
    totalMarks: 80,
    questions: [
      {
        id: "ocr-2023-1f-q1",
        questionNumber: "1",
        question: "Calculate 10% of 250",
        marks: 2,
        category: "Number",
        topic: "Percentages",
        difficulty: "Foundation",
        answer: "25",
        working: "10% = 10/100\n10/100 × 250 = 25"
      },
      {
        id: "ocr-2023-1f-q2",
        questionNumber: "2",
        question: "Simplify 2x + 3y + 4x - y",
        marks: 2,
        category: "Algebra",
        topic: "Simplifying Expressions",
        difficulty: "Foundation",
        answer: "6x + 2y",
        working: "2x + 4x = 6x\n3y - y = 2y\n6x + 2y"
      },
      {
        id: "ocr-2023-1f-q3",
        questionNumber: "3",
        question: "Find the perimeter of a rectangle with length 8cm and width 5cm",
        marks: 2,
        category: "Geometry",
        topic: "Area and Perimeter",
        difficulty: "Foundation",
        answer: "26cm",
        working: "Perimeter = 2(length + width)\nPerimeter = 2(8 + 5)\nPerimeter = 2 × 13\nPerimeter = 26cm"
      },
      {
        id: "ocr-2023-1f-q4",
        questionNumber: "4",
        question: "Convert 0.75 to a fraction in its simplest form",
        marks: 2,
        category: "Number",
        topic: "Fractions and Decimals",
        difficulty: "Foundation",
        answer: "3/4",
        working: "0.75 = 75/100\n75/100 = 3/4 (simplified)"
      },
      {
        id: "ocr-2023-1f-q5",
        questionNumber: "5",
        question: "Solve 3x + 4 = 19",
        marks: 2,
        category: "Algebra",
        topic: "Linear Equations",
        difficulty: "Foundation",
        answer: "x = 5",
        working: "3x + 4 = 19\n3x = 19 - 4\n3x = 15\nx = 5"
      },
      {
        id: "ocr-2023-1f-q6",
        questionNumber: "6",
        question: "Calculate the mean of: 4, 7, 2, 9, 3",
        marks: 2,
        category: "Statistics",
        topic: "Averages",
        difficulty: "Foundation",
        answer: "5",
        working: "Mean = sum ÷ count\nMean = (4+7+2+9+3) ÷ 5\nMean = 25 ÷ 5\nMean = 5"
      },
      {
        id: "ocr-2023-1f-q7",
        questionNumber: "7",
        question: "Find the area of a triangle with base 6cm and height 4cm",
        marks: 2,
        category: "Geometry",
        topic: "Area and Perimeter",
        difficulty: "Foundation",
        answer: "12cm²",
        working: "Area = ½ × base × height\nArea = ½ × 6 × 4\nArea = ½ × 24\nArea = 12cm²"
      },
      {
        id: "ocr-2023-1f-q8",
        questionNumber: "8",
        question: "What is the median of the numbers: 3, 7, 2, 9, 5, 1, 6?",
        marks: 2,
        category: "Statistics",
        topic: "Averages",
        difficulty: "Foundation",
        answer: "5",
        working: "Ordered: 1, 2, 3, 5, 6, 7, 9\nMedian = middle value = 5"
      }
    ]
  },
  {
    id: "ocr-2023-2h",
    examBoard: "OCR",
    year: 2023,
    paper: "Paper 2H",
    difficulty: "Higher",
    totalMarks: 100,
    questions: [
      {
        id: "ocr-2023-2h-q1",
        questionNumber: "1",
        question: "Factorise x² + 5x + 6",
        marks: 2,
        category: "Algebra",
        topic: "Factorising",
        difficulty: "Higher",
        answer: "(x + 2)(x + 3)",
        working: "Find factors of 6 that add to 5\nFactors of 6: 1×6, 2×3\n2 + 3 = 5\n(x + 2)(x + 3)"
      },
      {
        id: "ocr-2023-2h-q2",
        questionNumber: "2",
        question: "Solve the inequality 3x - 4 > 8",
        marks: 2,
        category: "Algebra",
        topic: "Inequalities",
        difficulty: "Higher",
        answer: "x > 4",
        working: "3x - 4 > 8\n3x > 8 + 4\n3x > 12\nx > 4"
      },
      {
        id: "ocr-2023-2h-q3",
        questionNumber: "3",
        question: "Calculate the volume of a cylinder with radius 4cm and height 10cm",
        marks: 3,
        category: "Geometry",
        topic: "Volume",
        difficulty: "Higher",
        answer: "160π cm³",
        working: "Volume = πr²h\nVolume = π × 4² × 10\nVolume = π × 16 × 10\nVolume = 160π cm³"
      },
      {
        id: "ocr-2023-2h-q4",
        questionNumber: "4",
        question: "Find the nth term of the sequence: 5, 8, 11, 14, 17",
        marks: 2,
        category: "Algebra",
        topic: "Sequences",
        difficulty: "Higher",
        answer: "3n + 2",
        working: "Difference between terms = 3\nFirst term = 5\nnth term = 3n + 2"
      },
      {
        id: "ocr-2023-2h-q5",
        questionNumber: "5",
        question: "Solve the simultaneous equations: x + y = 7 and 2x - y = 8",
        marks: 4,
        category: "Algebra",
        topic: "Simultaneous Equations",
        difficulty: "Higher",
        answer: "x = 5, y = 2",
        working: "x + y = 7 (1)\n2x - y = 8 (2)\nAdd (1) and (2): 3x = 15\nx = 5\nSubstitute x = 5 into (1): 5 + y = 7\ny = 2"
      }
    ]
  }
];

// Function to find a full exam paper by question ID
export function findExamPaperByQuestionId(questionId: string): FullExamPaper | null {
  for (const paper of fullExamPapers) {
    const question = paper.questions.find(q => q.id === questionId);
    if (question) {
      return paper;
    }
  }
  return null;
}

// Function to find a specific question in an exam paper
export function findQuestionInPaper(paperId: string, questionId: string): FullExamQuestion | null {
  const paper = fullExamPapers.find(p => p.id === paperId);
  if (!paper) return null;
  
  return paper.questions.find(q => q.id === questionId) || null;
}
