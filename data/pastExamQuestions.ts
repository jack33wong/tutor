import { fullExamPapers } from './fullExamPapers';

export interface ExamQuestionMetadata {
  id: string;
  question: string;
  examBoard: string;
  year: number;
  paper: string;
  questionNumber: string;
  category: string;
  marks: number;
  difficulty: 'Foundation' | 'Higher';
  topic: string;
}

// Database of past exam questions with metadata
export const pastExamQuestions: ExamQuestionMetadata[] = [
  {
    id: "aqa-2023-1h-q1",
    question: "Solve the equation 3x + 7 = 22",
    examBoard: "AQA",
    year: 2023,
    paper: "Paper 1H",
    questionNumber: "1",
    category: "Algebra",
    marks: 2,
    difficulty: "Higher",
    topic: "Linear Equations"
  },
  {
    id: "aqa-2023-1h-q5",
    question: "Find the area of a triangle with base 8cm and height 6cm",
    examBoard: "AQA",
    year: 2023,
    paper: "Paper 1H",
    questionNumber: "5",
    category: "Geometry",
    marks: 2,
    difficulty: "Higher",
    topic: "Area and Perimeter"
  },
  {
    id: "edexcel-2022-1f-q3",
    question: "Calculate 15% of £120",
    examBoard: "Edexcel",
    year: 2022,
    paper: "Paper 1F",
    questionNumber: "3",
    category: "Number",
    marks: 2,
    difficulty: "Foundation",
    topic: "Percentages"
  },
  {
    id: "aqa-2022-2h-q12",
    question: "Factorise x² + 5x + 6",
    examBoard: "AQA",
    year: 2022,
    paper: "Paper 2H",
    questionNumber: "12",
    category: "Algebra",
    marks: 2,
    difficulty: "Higher",
    topic: "Factorising"
  },
  {
    id: "ocr-2023-1f-q8",
    question: "What is the median of the numbers: 3, 7, 2, 9, 5, 1, 6?",
    examBoard: "OCR",
    year: 2023,
    paper: "Paper 1F",
    questionNumber: "8",
    category: "Statistics",
    marks: 2,
    difficulty: "Foundation",
    topic: "Averages"
  },
  {
    id: "aqa-2023-3h-q15",
    question: "A circle has radius 5cm. Calculate the circumference. Give your answer in terms of π.",
    examBoard: "AQA",
    year: 2023,
    paper: "Paper 3H",
    questionNumber: "15",
    category: "Geometry",
    marks: 2,
    difficulty: "Higher",
    topic: "Circle Properties"
  },
  {
    id: "edexcel-2022-2f-q6",
    question: "Solve the inequality 2x + 3 > 11",
    examBoard: "Edexcel",
    year: 2022,
    paper: "Paper 2F",
    questionNumber: "6",
    category: "Algebra",
    marks: 3,
    difficulty: "Foundation",
    topic: "Inequalities"
  },
  {
    id: "aqa-2021-1h-q18",
    question: "Find the equation of the line passing through (2, 3) and (4, 7)",
    examBoard: "AQA",
    year: 2021,
    paper: "Paper 1H",
    questionNumber: "18",
    category: "Algebra",
    marks: 4,
    difficulty: "Higher",
    topic: "Coordinate Geometry"
  },
  {
    id: "ocr-2022-1f-q4",
    question: "Convert 0.75 to a fraction in its simplest form",
    examBoard: "OCR",
    year: 2022,
    paper: "Paper 1F",
    questionNumber: "4",
    category: "Number",
    marks: 2,
    difficulty: "Foundation",
    topic: "Fractions and Decimals"
  },
  {
    id: "edexcel-2023-3h-q20",
    question: "Prove that the sum of any two consecutive odd numbers is always even",
    examBoard: "Edexcel",
    year: 2023,
    paper: "Paper 3H",
    questionNumber: "20",
    category: "Algebra",
    marks: 4,
    difficulty: "Higher",
    topic: "Algebraic Proof"
  },
  {
    id: "aqa-2022-1f-q7",
    question: "Write 24 as a product of its prime factors",
    examBoard: "AQA",
    year: 2022,
    paper: "Paper 1F",
    questionNumber: "7",
    category: "Number",
    marks: 2,
    difficulty: "Foundation",
    topic: "Prime Factorisation"
  },
  {
    id: "ocr-2023-2h-q14",
    question: "The nth term of a sequence is 3n + 2. Find the 10th term.",
    examBoard: "OCR",
    year: 2023,
    paper: "Paper 2H",
    questionNumber: "14",
    category: "Algebra",
    marks: 2,
    difficulty: "Higher",
    topic: "Sequences"
  },
  {
    id: "aqa-2023-2f-q9",
    question: "Work out 2/3 + 1/4",
    examBoard: "AQA",
    year: 2023,
    paper: "Paper 2F",
    questionNumber: "9",
    category: "Number",
    marks: 2,
    difficulty: "Foundation",
    topic: "Adding Fractions"
  },
  {
    id: "edexcel-2022-1h-q16",
    question: "Expand and simplify (x + 3)(x - 2)",
    examBoard: "Edexcel",
    year: 2022,
    paper: "Paper 1H",
    questionNumber: "16",
    category: "Algebra",
    marks: 2,
    difficulty: "Higher",
    topic: "Expanding Brackets"
  },
  {
    id: "aqa-2021-3f-q11",
    question: "A bag contains 5 red balls and 3 blue balls. What is the probability of picking a red ball?",
    examBoard: "AQA",
    year: 2021,
    paper: "Paper 3F",
    questionNumber: "11",
    category: "Statistics",
    marks: 2,
    difficulty: "Foundation",
    topic: "Probability"
  },
  {
    id: "ocr-2022-2h-q19",
    question: "Solve the simultaneous equations: x + y = 7 and 2x - y = 8",
    examBoard: "OCR",
    year: 2022,
    paper: "Paper 2H",
    questionNumber: "19",
    category: "Algebra",
    marks: 4,
    difficulty: "Higher",
    topic: "Simultaneous Equations"
  },
  {
    id: "edexcel-2023-1f-q5",
    question: "Round 2.847 to 2 decimal places",
    examBoard: "Edexcel",
    year: 2023,
    paper: "Paper 1F",
    questionNumber: "5",
    category: "Number",
    marks: 1,
    difficulty: "Foundation",
    topic: "Rounding"
  },
  {
    id: "aqa-2023-2f-q1",
    question: "Work out 2/3 + 1/4",
    examBoard: "AQA",
    year: 2023,
    paper: "Paper 2F",
    questionNumber: "1",
    category: "Number",
    marks: 2,
    difficulty: "Foundation",
    topic: "Fractions"
  },
  {
    id: "aqa-2023-2f-q2",
    question: "Expand and simplify (x + 3)(x - 2)",
    examBoard: "AQA",
    year: 2023,
    paper: "Paper 2F",
    questionNumber: "2",
    category: "Algebra",
    marks: 2,
    difficulty: "Foundation",
    topic: "Expanding Brackets"
  },
  {
    id: "aqa-2023-2f-q3",
    question: "A bag contains 5 red balls and 3 blue balls. What is the probability of picking a red ball?",
    examBoard: "AQA",
    year: 2023,
    paper: "Paper 2F",
    questionNumber: "3",
    category: "Statistics",
    marks: 2,
    difficulty: "Foundation",
    topic: "Probability"
  },
  {
    id: "aqa-2023-2f-q4",
    question: "Solve the simultaneous equations: x + y = 7 and 2x - y = 8",
    examBoard: "AQA",
    year: 2023,
    paper: "Paper 2F",
    questionNumber: "4",
    category: "Algebra",
    marks: 3,
    difficulty: "Foundation",
    topic: "Simultaneous Equations"
  },
  {
    id: "aqa-2023-2f-q5",
    question: "Round 2.847 to 2 decimal places",
    examBoard: "AQA",
    year: 2023,
    paper: "Paper 2F",
    questionNumber: "5",
    category: "Number",
    marks: 1,
    difficulty: "Foundation",
    topic: "Rounding"
  },
  {
    id: "aqa-2023-2f-q6",
    question: "Find the area of a circle with radius 6cm. Give your answer in terms of π.",
    examBoard: "AQA",
    year: 2023,
    paper: "Paper 2F",
    questionNumber: "6",
    category: "Geometry",
    marks: 2,
    difficulty: "Foundation",
    topic: "Area of Circle"
  },
  {
    id: "aqa-2023-2f-q7",
    question: "Convert 0.75 to a fraction in its simplest form",
    examBoard: "AQA",
    year: 2023,
    paper: "Paper 2F",
    questionNumber: "7",
    category: "Number",
    marks: 2,
    difficulty: "Foundation",
    topic: "Decimals to Fractions"
  },
  {
    id: "aqa-2023-2f-q8",
    question: "Write 24 as a product of its prime factors",
    examBoard: "AQA",
    year: 2023,
    paper: "Paper 2F",
    questionNumber: "8",
    category: "Number",
    marks: 2,
    difficulty: "Foundation",
    topic: "Prime Factors"
  },
  {
    id: "edexcel-2022-1h-q1",
    question: "Solve the equation 2x² - 5x + 3 = 0",
    examBoard: "Edexcel",
    year: 2022,
    paper: "Paper 1H",
    questionNumber: "1",
    category: "Algebra",
    marks: 3,
    difficulty: "Higher",
    topic: "Quadratic Equations"
  },
  {
    id: "edexcel-2022-1h-q2",
    question: "Find the gradient of the line passing through points (2, 3) and (5, 9)",
    examBoard: "Edexcel",
    year: 2022,
    paper: "Paper 1H",
    questionNumber: "2",
    category: "Algebra",
    marks: 2,
    difficulty: "Higher",
    topic: "Straight Line Graphs"
  },
  {
    id: "edexcel-2022-1h-q3",
    question: "Calculate the area of a sector of a circle with radius 8cm and angle 60°",
    examBoard: "Edexcel",
    year: 2022,
    paper: "Paper 1H",
    questionNumber: "3",
    category: "Geometry",
    marks: 3,
    difficulty: "Higher",
    topic: "Circle Sectors"
  },
  {
    id: "edexcel-2022-1h-q4",
    question: "Find the nth term of the sequence: 3, 7, 11, 15, 19",
    examBoard: "Edexcel",
    year: 2022,
    paper: "Paper 1H",
    questionNumber: "4",
    category: "Algebra",
    marks: 2,
    difficulty: "Higher",
    topic: "Sequences"
  },
  {
    id: "edexcel-2022-1h-q5",
    question: "Solve the inequality 3x - 2 > 4x + 1",
    examBoard: "Edexcel",
    year: 2022,
    paper: "Paper 1H",
    questionNumber: "5",
    category: "Algebra",
    marks: 2,
    difficulty: "Higher",
    topic: "Inequalities"
  },
  {
    id: "edexcel-2022-1h-q6",
    question: "Factorise completely: 2x²y - 8xy²",
    examBoard: "Edexcel",
    year: 2022,
    paper: "Paper 1H",
    questionNumber: "6",
    category: "Algebra",
    marks: 2,
    difficulty: "Higher",
    topic: "Factorising"
  },
  {
    id: "edexcel-2022-1h-q7",
    question: "Calculate the volume of a cone with radius 6cm and height 10cm",
    examBoard: "Edexcel",
    year: 2022,
    paper: "Paper 1H",
    questionNumber: "7",
    category: "Geometry",
    marks: 3,
    difficulty: "Higher",
    topic: "Volume"
  },
  {
    id: "edexcel-2022-1h-q8",
    question: "Find the equation of the line perpendicular to y = 2x + 1 that passes through (3, 4)",
    examBoard: "Edexcel",
    year: 2022,
    paper: "Paper 1H",
    questionNumber: "8",
    category: "Algebra",
    marks: 3,
    difficulty: "Higher",
    topic: "Perpendicular Lines"
  }
];

// Function to normalize text for comparison (remove punctuation, extra spaces, etc.)
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')     // Replace multiple spaces with single space
    .trim();
}

// Function to calculate similarity between two strings (improved approach)
export function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeText(str1);
  const normalized2 = normalizeText(str2);
  
  // Simple word-based similarity
  const words1 = normalized1.split(' ');
  const words2 = normalized2.split(' ');
  
  // Filter out very short/common words
  const meaningfulWords1 = words1.filter(word => word.length > 1);
  const meaningfulWords2 = words2.filter(word => word.length > 1);
  
  const commonWords = meaningfulWords1.filter(word => 
    meaningfulWords2.includes(word)
  );
  
  // Use average of both word counts for more balanced similarity
  const avgWords = (meaningfulWords1.length + meaningfulWords2.length) / 2;
  return avgWords > 0 ? commonWords.length / avgWords : 0;
}

// Function to detect if a question matches a past exam question
export function detectExamQuestion(userInput: string): ExamQuestionMetadata | null {
  console.log('🔍 Detecting exam question for:', userInput);
  
  const normalizedInput = normalizeText(userInput);
  console.log('📝 Normalized input:', normalizedInput);
  
  // Try multiple detection methods
  
  // Method 1: High similarity match
  for (const examQuestion of pastExamQuestions) {
    const similarity = calculateSimilarity(userInput, examQuestion.question);
    console.log(`📊 Similarity with "${examQuestion.question}": ${similarity.toFixed(3)}`);
    
    if (similarity >= 0.6) { // Lowered threshold to 60%
      console.log('✅ High similarity match found!');
      return examQuestion;
    }
  }
  
  // Method 2: Key phrase matching
  for (const examQuestion of pastExamQuestions) {
    const normalizedQuestion = normalizeText(examQuestion.question);
    
    // Extract key mathematical terms
    const inputWords = normalizedInput.split(' ').filter(w => w.length > 2);
    const questionWords = normalizedQuestion.split(' ').filter(w => w.length > 2);
    
    // Check if most key terms match
    const matchingWords = inputWords.filter(word => questionWords.includes(word));
    const keywordSimilarity = matchingWords.length / Math.min(inputWords.length, questionWords.length);
    
    console.log(`🔑 Keyword similarity with "${examQuestion.question}": ${keywordSimilarity.toFixed(3)}`);
    
    if (keywordSimilarity >= 0.7) {
      console.log('✅ Keyword match found!');
      return examQuestion;
    }
  }
  
  // Method 3: Partial string matching (for abbreviated questions)
  for (const examQuestion of pastExamQuestions) {
    const normalizedQuestion = normalizeText(examQuestion.question);
    
    // Check if input is a substantial substring of the question
    if (normalizedInput.length > 8 && normalizedQuestion.includes(normalizedInput)) {
      console.log('✅ Substring match found!');
      return examQuestion;
    }
    
    // Check if question is a substantial substring of input  
    if (normalizedQuestion.length > 8 && normalizedInput.includes(normalizedQuestion)) {
      console.log('✅ Reverse substring match found!');
      return examQuestion;
    }
  }
  
  console.log('❌ No exam question match found');
  return null;
}

// Function to get random past paper questions
export function getRandomExamQuestions(count: number = 3): ExamQuestionMetadata[] {
  const shuffled = [...pastExamQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Function to format a suggested question for display
export function formatSuggestedQuestion(metadata: ExamQuestionMetadata): string {
  return `**${metadata.question}**

<small>
*${metadata.examBoard} ${metadata.year} ${metadata.paper} | Q${metadata.questionNumber} | ${metadata.marks} marks | ${metadata.difficulty} | ${metadata.topic}*
</small>`;
}

// Function to format exam metadata for display
export function formatExamMetadata(metadata: ExamQuestionMetadata): string {
  return `<small>

**Exam Board:** ${metadata.examBoard} | **Year:** ${metadata.year} | **Paper:** ${metadata.paper}  
**Question:** ${metadata.questionNumber} | **Category:** ${metadata.category} | **Marks:** ${metadata.marks} | **Level:** ${metadata.difficulty}  
**Topic:** ${metadata.topic}

</small>`;
}

// Function to get the correct answer for a question
export function getCorrectAnswer(questionId: string): string | null {
  for (const examPaper of fullExamPapers) {
    const question = examPaper.questions.find(q => q.id === questionId);
    if (question && question.answer) {
      return question.answer;
    }
  }
  return null;
}
