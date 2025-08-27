export interface ExamPaper {
  id: string;
  title: string;
  examBoard: string;
  paperType: string;
  difficulty: 'foundation' | 'higher';
  timeLimit: number;
  topics: string[];
  description: string;
}

export const examPapers: ExamPaper[] = [
  {
    id: 'gcse-maths-1',
    title: 'GCSE Mathematics Paper 1',
    examBoard: 'AQA',
    paperType: 'Foundation',
    difficulty: 'foundation',
    timeLimit: 90,
    topics: ['Number', 'Algebra', 'Ratio and Proportion', 'Geometry and Measures'],
    description: 'Foundation tier mathematics paper covering core topics.'
  },
  {
    id: 'gcse-maths-2',
    title: 'GCSE Mathematics Paper 2',
    examBoard: 'AQA',
    paperType: 'Foundation',
    difficulty: 'foundation',
    timeLimit: 90,
    topics: ['Number', 'Algebra', 'Ratio and Proportion', 'Geometry and Measures', 'Statistics'],
    description: 'Foundation tier mathematics paper with statistics focus.'
  },
  {
    id: 'gcse-maths-3',
    title: 'GCSE Mathematics Paper 3',
    examBoard: 'AQA',
    paperType: 'Foundation',
    difficulty: 'foundation',
    timeLimit: 90,
    topics: ['Number', 'Algebra', 'Ratio and Proportion', 'Geometry and Measures', 'Probability'],
    description: 'Foundation tier mathematics paper with probability focus.'
  },
  {
    id: 'gcse-maths-higher-1',
    title: 'GCSE Mathematics Higher Paper 1',
    examBoard: 'AQA',
    paperType: 'Higher',
    difficulty: 'higher',
    timeLimit: 90,
    topics: ['Number', 'Algebra', 'Ratio and Proportion', 'Geometry and Measures', 'Trigonometry'],
    description: 'Higher tier mathematics paper covering advanced topics.'
  },
  {
    id: 'gcse-maths-higher-2',
    title: 'GCSE Mathematics Higher Paper 2',
    examBoard: 'AQA',
    paperType: 'Higher',
    difficulty: 'higher',
    timeLimit: 90,
    topics: ['Number', 'Algebra', 'Ratio and Proportion', 'Geometry and Measures', 'Statistics'],
    description: 'Higher tier mathematics paper with advanced statistics.'
  },
  {
    id: 'gcse-maths-higher-3',
    title: 'GCSE Mathematics Higher Paper 3',
    examBoard: 'AQA',
    paperType: 'Higher',
    difficulty: 'higher',
    timeLimit: 90,
    topics: ['Number', 'Algebra', 'Ratio and Proportion', 'Geometry and Measures', 'Probability', 'Trigonometry'],
    description: 'Higher tier mathematics paper with advanced probability and trigonometry.'
  }
];
