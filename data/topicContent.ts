export interface TopicContent {
  topicId: string;
  title: string;
  description: string;
  difficulty: 'foundation' | 'higher';
  learningObjectives: string[];
  keyConcepts: KeyConcept[];
  examples: Example[];
  practiceQuestions: PracticeQuestion[];
  commonMistakes: string[];
  tips: string[];
  relatedTopics: string[];
  estimatedStudyTime: number; // in minutes
}

export interface KeyConcept {
  id: string;
  title: string;
  description: string;
  formula?: string;
  rules?: string[];
  examples?: string[];
}

export interface Example {
  id: string;
  title: string;
  question: string;
  solution: string;
  working: string;
  explanation: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
}

export interface PracticeQuestion {
  id: string;
  question: string;
  marks: number;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  questionType: 'multiple-choice' | 'short-answer' | 'long-answer';
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  working?: string;
  hints?: string[];
}

export const topicContent: TopicContent[] = [
  {
    topicId: 'number',
    title: 'Number',
    description: 'Understanding and working with numbers, including fractions, decimals, percentages, and ratios.',
    difficulty: 'foundation',
    learningObjectives: [
      'Understand place value for numbers up to 10 million',
      'Order positive and negative numbers',
      'Round numbers to a given number of decimal places',
      'Use estimation to check calculations',
      'Convert between fractions, decimals and percentages',
      'Add, subtract, multiply and divide fractions',
      'Find fractions of amounts',
      'Calculate percentage increase and decrease',
      'Write ratios in simplest form',
      'Divide amounts in given ratios',
      'Solve problems involving direct proportion',
      'Use scale factors and maps'
    ],
    keyConcepts: [
      {
        id: 'place-value',
        title: 'Place Value',
        description: 'Understanding the value of each digit in a number based on its position.',
        rules: [
          'Each position represents a power of 10',
          'Moving left multiplies by 10',
          'Moving right divides by 10'
        ],
        examples: [
          'In 2,456: 2 = 2000, 4 = 400, 5 = 50, 6 = 6'
        ]
      },
      {
        id: 'fractions',
        title: 'Fractions',
        description: 'Parts of a whole, represented as a ratio of two numbers.',
        formula: 'a/b where a is numerator, b is denominator',
        rules: [
          'To add/subtract: find common denominator',
          'To multiply: multiply numerators and denominators',
          'To divide: multiply by reciprocal'
        ]
      },
      {
        id: 'percentages',
        title: 'Percentages',
        description: 'Fractions with denominator 100, useful for comparing quantities.',
        formula: 'Percentage = (Part/Whole) × 100',
        rules: [
          'To find percentage: divide part by whole, multiply by 100',
          'To find part: multiply whole by percentage, divide by 100',
          'Percentage increase = (New - Original)/Original × 100'
        ]
      },
      {
        id: 'ratios',
        title: 'Ratios',
        description: 'Comparison of two or more quantities.',
        rules: [
          'Simplify by dividing by common factors',
          'To divide amount: add ratio parts, divide amount by total parts',
          'Scale factors multiply all parts of ratio'
        ]
      }
    ],
    examples: [
      {
        id: 'ex1',
        title: 'Adding Fractions',
        question: 'Calculate 2/3 + 1/4',
        solution: '11/12',
        working: '2/3 + 1/4 = 8/12 + 3/12 = 11/12',
        explanation: 'Find common denominator (12), convert fractions, then add numerators.',
        difficulty: 'basic'
      },
      {
        id: 'ex2',
        title: 'Percentage Increase',
        question: 'A shirt costs £40. It increases in price by 15%. What is the new price?',
        solution: '£46',
        working: '15% of £40 = 0.15 × 40 = £6\nNew price = £40 + £6 = £46',
        explanation: 'Calculate 15% of original price, then add to original.',
        difficulty: 'intermediate'
      },
      {
        id: 'ex3',
        title: 'Ratio Division',
        question: 'Divide £120 in the ratio 3:2:1',
        solution: '£60, £40, £20',
        working: 'Total parts = 3 + 2 + 1 = 6\n£120 ÷ 6 = £20 per part\n3 parts = 3 × £20 = £60\n2 parts = 2 × £20 = £40\n1 part = 1 × £20 = £20',
        explanation: 'Add ratio parts, divide total by sum, multiply each part by result.',
        difficulty: 'intermediate'
      }
    ],
    practiceQuestions: [
      {
        id: 'pq1',
        question: 'What is 3/4 as a decimal?',
        marks: 1,
        difficulty: 'basic',
        questionType: 'multiple-choice',
        options: ['0.25', '0.5', '0.75', '0.8'],
        correctAnswer: '0.75',
        explanation: '3/4 = 0.75 (divide 3 by 4)',
        hints: ['Divide the numerator by the denominator', 'Think about quarters']
      },
      {
        id: 'pq2',
        question: 'Calculate 25% of £80',
        marks: 2,
        difficulty: 'basic',
        questionType: 'short-answer',
        correctAnswer: 20,
        explanation: '25% = 0.25, so 0.25 × 80 = 20',
        working: '25% of £80 = 0.25 × 80 = £20',
        hints: ['Convert percentage to decimal', 'Multiply by the amount']
      },
      {
        id: 'pq3',
        question: 'Simplify the ratio 12:18',
        marks: 2,
        difficulty: 'basic',
        questionType: 'short-answer',
        correctAnswer: '2:3',
        explanation: 'Divide both numbers by their highest common factor (6)',
        working: '12:18 = (12÷6):(18÷6) = 2:3',
        hints: ['Find the highest common factor', 'Divide both numbers by it']
      }
    ],
    commonMistakes: [
      'Forgetting to find common denominators when adding fractions',
      'Not simplifying ratios to their simplest form',
      'Confusing percentage increase with percentage of',
      'Rounding too early in multi-step calculations'
    ],
    tips: [
      'Always check if fractions can be simplified before calculating',
      'Use estimation to verify your answers',
      'Remember that percentages are always out of 100',
      'Practice mental arithmetic for common fractions and percentages'
    ],
    relatedTopics: ['algebra', 'geometry', 'statistics'],
    estimatedStudyTime: 120
  },
  {
    topicId: 'algebra',
    title: 'Algebra',
    description: 'Using letters and symbols to represent numbers and quantities in formulae, equations, and expressions.',
    difficulty: 'foundation',
    learningObjectives: [
      'Simplify algebraic expressions',
      'Substitute numbers into formulae',
      'Change the subject of a formula',
      'Expand and factorise expressions',
      'Solve linear equations with one unknown',
      'Solve equations with brackets',
      'Solve simple inequalities',
      'Solve simultaneous equations',
      'Generate arithmetic sequences',
      'Find the nth term of a sequence',
      'Recognise geometric sequences',
      'Find missing terms in sequences'
    ],
    keyConcepts: [
      {
        id: 'expressions',
        title: 'Algebraic Expressions',
        description: 'Mathematical phrases containing variables, numbers, and operations.',
        rules: [
          'Like terms can be combined',
          'Variables with same letter and power are like terms',
          'Constants are numbers without variables'
        ]
      },
      {
        id: 'equations',
        title: 'Linear Equations',
        description: 'Equations where variables are only to the first power.',
        rules: [
          'Same operation to both sides keeps equation balanced',
          'Collect like terms on same side',
          'Isolate variable on one side'
        ]
      },
      {
        id: 'sequences',
        title: 'Number Sequences',
        description: 'Ordered lists of numbers following a pattern.',
        rules: [
          'Arithmetic sequences have common difference',
          'Geometric sequences have common ratio',
          'nth term formula: a + (n-1)d for arithmetic'
        ]
      }
    ],
    examples: [
      {
        id: 'ex1',
        title: 'Simplifying Expressions',
        question: 'Simplify 3x + 2y + 5x - y',
        solution: '8x + y',
        working: '3x + 2y + 5x - y = (3x + 5x) + (2y - y) = 8x + y',
        explanation: 'Collect like terms: combine x terms and y terms separately.',
        difficulty: 'basic'
      },
      {
        id: 'ex2',
        title: 'Solving Linear Equations',
        question: 'Solve 2x + 3 = 11',
        solution: 'x = 4',
        working: '2x + 3 = 11\n2x = 8\nx = 4',
        explanation: 'Subtract 3 from both sides, then divide by 2.',
        difficulty: 'basic'
      },
      {
        id: 'ex3',
        title: 'Finding nth Term',
        question: 'Find the nth term of the sequence: 5, 8, 11, 14, ...',
        solution: '3n + 2',
        working: 'Common difference = 3\nFirst term = 5\nnth term = 5 + (n-1)3 = 3n + 2',
        explanation: 'Use formula a + (n-1)d where a is first term, d is common difference.',
        difficulty: 'intermediate'
      }
    ],
    practiceQuestions: [
      {
        id: 'pq1',
        question: 'Simplify 4a + 3b - 2a + b',
        marks: 2,
        difficulty: 'basic',
        questionType: 'short-answer',
        correctAnswer: '2a + 4b',
        explanation: 'Collect like terms: 4a - 2a = 2a, 3b + b = 4b',
        hints: ['Group like terms together', 'Combine coefficients']
      },
      {
        id: 'pq2',
        question: 'Solve 3x - 7 = 8',
        marks: 2,
        difficulty: 'basic',
        questionType: 'short-answer',
        correctAnswer: 5,
        explanation: 'Add 7 to both sides, then divide by 3',
        working: '3x - 7 = 8\n3x = 15\nx = 5',
        hints: ['Add 7 to both sides', 'Divide by 3']
      },
      {
        id: 'pq3',
        question: 'Find the next term in: 2, 6, 10, 14, ...',
        marks: 2,
        difficulty: 'basic',
        questionType: 'short-answer',
        correctAnswer: 18,
        explanation: 'Common difference is 4, so next term is 14 + 4 = 18',
        hints: ['Find the difference between terms', 'Add the difference to the last term']
      }
    ],
    commonMistakes: [
      'Forgetting to change signs when moving terms across equals sign',
      'Not collecting all like terms',
      'Making errors with negative numbers',
      'Confusing expressions with equations'
    ],
    tips: [
      'Always check your answer by substituting back into the original equation',
      'Draw a line under the equals sign to keep track of steps',
      'Remember that subtraction is the same as adding a negative number',
      'Practice mental arithmetic to avoid calculation errors'
    ],
    relatedTopics: ['number', 'geometry', 'higher-algebra'],
    estimatedStudyTime: 150
  },
  {
    topicId: 'geometry',
    title: 'Geometry and Measures',
    description: 'Properties of shapes, angles, area, perimeter, volume, and transformations.',
    difficulty: 'foundation',
    learningObjectives: [
      'Calculate angles in triangles and quadrilaterals',
      'Understand angle properties of parallel lines',
      'Recognise and name 2D and 3D shapes',
      'Use angle facts to solve problems',
      'Calculate area and perimeter of rectangles and triangles',
      'Find area and circumference of circles',
      'Calculate area of compound shapes',
      'Solve problems involving area and perimeter',
      'Calculate volume of cuboids and prisms',
      'Find surface area of 3D shapes',
      'Calculate volume and surface area of cylinders',
      'Solve problems involving volume and capacity'
    ],
    keyConcepts: [
      {
        id: 'angles',
        title: 'Angle Properties',
        description: 'Rules and relationships between angles in different geometric situations.',
        rules: [
          'Angles on a straight line add to 180°',
          'Angles around a point add to 360°',
          'Vertically opposite angles are equal',
          'Corresponding angles are equal (parallel lines)',
          'Alternate angles are equal (parallel lines)'
        ]
      },
      {
        id: 'area',
        title: 'Area and Perimeter',
        description: 'Measurements of 2D shapes and their boundaries.',
        formula: 'Rectangle: A = l × w, P = 2(l + w)\nTriangle: A = ½bh\nCircle: A = πr², C = 2πr',
        rules: [
          'Area is measured in square units',
          'Perimeter is measured in linear units',
          'For compound shapes, break into simple shapes'
        ]
      },
      {
        id: 'volume',
        title: 'Volume and Surface Area',
        description: 'Measurements of 3D shapes and their surfaces.',
        formula: 'Cuboid: V = l × w × h, SA = 2(lw + lh + wh)\nCylinder: V = πr²h, SA = 2πr² + 2πrh',
        rules: [
          'Volume is measured in cubic units',
          'Surface area is measured in square units',
          'For prisms, volume = area of base × height'
        ]
      }
    ],
    examples: [
      {
        id: 'ex1',
        title: 'Finding Missing Angles',
        question: 'In a triangle, two angles are 45° and 60°. Find the third angle.',
        solution: '75°',
        working: 'Sum of angles in triangle = 180°\nThird angle = 180° - 45° - 60° = 75°',
        explanation: 'Use the fact that angles in a triangle sum to 180°.',
        difficulty: 'basic'
      },
      {
        id: 'ex2',
        title: 'Area of Compound Shape',
        question: 'Find the area of an L-shape made from two rectangles: 8cm × 4cm and 3cm × 4cm.',
        solution: '44 cm²',
        working: 'Area 1 = 8 × 4 = 32 cm²\nArea 2 = 3 × 4 = 12 cm²\nTotal area = 32 + 12 = 44 cm²',
        explanation: 'Break compound shape into simple rectangles, find area of each, then add.',
        difficulty: 'intermediate'
      },
      {
        id: 'ex3',
        title: 'Volume of Cylinder',
        question: 'Find the volume of a cylinder with radius 3cm and height 8cm.',
        solution: '226.2 cm³',
        working: 'V = πr²h = π × 3² × 8 = π × 9 × 8 = 72π ≈ 226.2 cm³',
        explanation: 'Use formula V = πr²h, substitute values, then calculate.',
        difficulty: 'intermediate'
      }
    ],
    practiceQuestions: [
      {
        id: 'pq1',
        question: 'What is the sum of angles in a quadrilateral?',
        marks: 1,
        difficulty: 'basic',
        questionType: 'multiple-choice',
        options: ['180°', '270°', '360°', '540°'],
        correctAnswer: '360°',
        explanation: 'Angles in a quadrilateral always sum to 360°',
        hints: ['Think about splitting a quadrilateral into triangles']
      },
      {
        id: 'pq2',
        question: 'Find the area of a rectangle with length 6cm and width 4cm',
        marks: 2,
        difficulty: 'basic',
        questionType: 'short-answer',
        correctAnswer: 24,
        explanation: 'Area = length × width = 6 × 4 = 24 cm²',
        working: 'Area = 6 × 4 = 24 cm²',
        hints: ['Use the formula: area = length × width']
      },
      {
        id: 'pq3',
        question: 'Calculate the circumference of a circle with radius 5cm',
        marks: 2,
        difficulty: 'basic',
        questionType: 'short-answer',
        correctAnswer: '31.4',
        explanation: 'Circumference = 2πr = 2 × π × 5 ≈ 31.4 cm',
        working: 'C = 2πr = 2 × π × 5 ≈ 31.4 cm',
        hints: ['Use the formula: circumference = 2πr', 'Remember π ≈ 3.14']
      }
    ],
    commonMistakes: [
      'Forgetting to include units in answers',
      'Confusing area and perimeter formulas',
      'Not using π in circle calculations',
      'Making arithmetic errors in multi-step problems'
    ],
    tips: [
      'Always draw a diagram for geometry problems',
      'Check that your answer makes sense (e.g., area should be positive)',
      'Remember common angle facts',
      'Use estimation to verify calculations'
    ],
    relatedTopics: ['number', 'algebra', 'higher-geometry'],
    estimatedStudyTime: 180
  },
  {
    topicId: 'statistics',
    title: 'Statistics and Probability',
    description: 'Collecting, presenting, and interpreting data, and understanding probability.',
    difficulty: 'foundation',
    learningObjectives: [
      'Design and use data collection sheets',
      'Draw and interpret frequency tables',
      'Calculate mean, median, mode and range',
      'Interpret pie charts and bar charts',
      'Calculate probability of single events',
      'Use probability scale from 0 to 1',
      'Find probability of combined events',
      'Use tree diagrams for probability'
    ],
    keyConcepts: [
      {
        id: 'averages',
        title: 'Measures of Central Tendency',
        description: 'Different ways to represent the "middle" of a data set.',
        rules: [
          'Mean: sum of all values ÷ number of values',
          'Median: middle value when ordered',
          'Mode: most frequent value',
          'Range: highest value - lowest value'
        ]
      },
      {
        id: 'probability',
        title: 'Probability',
        description: 'Likelihood of an event occurring, measured from 0 to 1.',
        rules: [
          'Probability = number of favourable outcomes ÷ total outcomes',
          'Probability ranges from 0 (impossible) to 1 (certain)',
          'P(not A) = 1 - P(A)',
          'For independent events: P(A and B) = P(A) × P(B)'
        ]
      },
      {
        id: 'data-presentation',
        title: 'Data Presentation',
        description: 'Different ways to display and interpret data.',
        rules: [
          'Bar charts: compare categories',
          'Pie charts: show proportions',
          'Frequency tables: count occurrences',
          'Always include labels and titles'
        ]
      }
    ],
    examples: [
      {
        id: 'ex1',
        title: 'Finding Mean',
        question: 'Find the mean of: 12, 15, 18, 20, 25',
        solution: '18',
        working: 'Sum = 12 + 15 + 18 + 20 + 25 = 90\nNumber of values = 5\nMean = 90 ÷ 5 = 18',
        explanation: 'Add all values, divide by number of values.',
        difficulty: 'basic'
      },
      {
        id: 'ex2',
        title: 'Probability Calculation',
        question: 'What is the probability of rolling a 6 on a fair dice?',
        solution: '1/6',
        working: 'Number of favourable outcomes = 1 (rolling a 6)\nTotal outcomes = 6\nP(6) = 1/6',
        explanation: 'Use probability formula: favourable outcomes ÷ total outcomes.',
        difficulty: 'basic'
      },
      {
        id: 'ex3',
        title: 'Combined Probability',
        question: 'Find probability of rolling two 6s in a row on a fair dice.',
        solution: '1/36',
        working: 'P(first 6) = 1/6\nP(second 6) = 1/6\nP(two 6s) = 1/6 × 1/6 = 1/36',
        explanation: 'Multiply probabilities for independent events.',
        difficulty: 'intermediate'
      }
    ],
    practiceQuestions: [
      {
        id: 'pq1',
        question: 'What is the median of: 3, 7, 2, 9, 5?',
        marks: 2,
        difficulty: 'basic',
        questionType: 'short-answer',
        correctAnswer: 5,
        explanation: 'Order: 2, 3, 5, 7, 9. Middle value is 5',
        working: 'Ordered: 2, 3, 5, 7, 9\nMedian = 5',
        hints: ['Put numbers in order first', 'Find the middle value']
      },
      {
        id: 'pq2',
        question: 'Calculate the range of: 8, 12, 15, 3, 20',
        marks: 2,
        difficulty: 'basic',
        questionType: 'short-answer',
        correctAnswer: 17,
        explanation: 'Range = highest - lowest = 20 - 3 = 17',
        working: 'Range = 20 - 3 = 17',
        hints: ['Find highest and lowest values', 'Subtract lowest from highest']
      },
      {
        id: 'pq3',
        question: 'What is the probability of not rolling a 6 on a fair dice?',
        marks: 2,
        difficulty: 'basic',
        questionType: 'short-answer',
        correctAnswer: '5/6',
        explanation: 'P(not 6) = 1 - P(6) = 1 - 1/6 = 5/6',
        working: 'P(not 6) = 1 - 1/6 = 5/6',
        hints: ['Use the rule: P(not A) = 1 - P(A)', 'P(6) = 1/6']
      }
    ],
    commonMistakes: [
      'Confusing mean, median, and mode',
      'Not ordering data before finding median',
      'Forgetting that probability must be between 0 and 1',
      'Making errors in probability calculations'
    ],
    tips: [
      'Always check that probabilities add up to 1',
      'Use a calculator for mean calculations',
      'Draw diagrams for probability problems',
      'Remember that median is not affected by extreme values'
    ],
    relatedTopics: ['number', 'algebra', 'higher-algebra'],
    estimatedStudyTime: 120
  },
  {
    topicId: 'higher-algebra',
    title: 'Higher Algebra',
    description: 'Advanced algebraic concepts including quadratics, functions, and sequences.',
    difficulty: 'higher',
    learningObjectives: [
      'Factorise quadratic expressions',
      'Solve quadratic equations by factorising',
      'Use the quadratic formula',
      'Complete the square',
      'Solve simultaneous equations',
      'Understand functions and their graphs',
      'Find gradients and equations of lines',
      'Solve inequalities'
    ],
    keyConcepts: [
      {
        id: 'quadratics',
        title: 'Quadratic Equations',
        description: 'Equations where the highest power of the variable is 2.',
        formula: 'ax² + bx + c = 0',
        rules: [
          'Can be solved by factorising, completing the square, or quadratic formula',
          'Quadratic formula: x = (-b ± √(b² - 4ac)) / 2a',
          'Discriminant b² - 4ac determines number of solutions'
        ]
      },
      {
        id: 'functions',
        title: 'Functions',
        description: 'Mathematical relationships between variables.',
        rules: [
          'f(x) notation represents a function',
          'Domain is the set of input values',
          'Range is the set of output values',
          'Inverse function reverses the relationship'
        ]
      }
    ],
    examples: [
      {
        id: 'ex1',
        title: 'Solving Quadratic by Factorising',
        question: 'Solve x² + 5x + 6 = 0',
        solution: 'x = -2 or x = -3',
        working: 'x² + 5x + 6 = 0\n(x + 2)(x + 3) = 0\nx = -2 or x = -3',
        explanation: 'Factorise the quadratic expression, then set each bracket to zero.',
        difficulty: 'intermediate'
      },
      {
        id: 'ex2',
        title: 'Using Quadratic Formula',
        question: 'Solve 2x² - 7x + 3 = 0',
        solution: 'x = 3 or x = 0.5',
        working: 'x = (-(-7) ± √((-7)² - 4×2×3)) / (2×2)\nx = (7 ± √(49 - 24)) / 4\nx = (7 ± √25) / 4\nx = (7 ± 5) / 4\nx = 12/4 = 3 or x = 2/4 = 0.5',
        explanation: 'Use the quadratic formula with a=2, b=-7, c=3.',
        difficulty: 'advanced'
      }
    ],
    practiceQuestions: [
      {
        id: 'pq1',
        question: 'Factorise x² - 9',
        marks: 2,
        difficulty: 'basic',
        questionType: 'short-answer',
        correctAnswer: '(x + 3)(x - 3)',
        explanation: 'This is a difference of two squares: x² - 9 = x² - 3² = (x + 3)(x - 3)',
        working: 'x² - 9 = x² - 3² = (x + 3)(x - 3)',
        hints: ['Look for a difference of two squares', 'Use the pattern a² - b² = (a + b)(a - b)']
      },
      {
        id: 'pq2',
        question: 'Solve x² - 4x + 4 = 0',
        marks: 3,
        difficulty: 'intermediate',
        questionType: 'short-answer',
        correctAnswer: 'x = 2',
        explanation: 'This is a perfect square: x² - 4x + 4 = (x - 2)² = 0, so x = 2',
        working: 'x² - 4x + 4 = (x - 2)² = 0\nx - 2 = 0\nx = 2',
        hints: ['Check if this is a perfect square', 'Look for (x - a)² pattern']
      }
    ],
    commonMistakes: [
      'Forgetting to check if quadratic can be factorised first',
      'Making errors with negative numbers in quadratic formula',
      'Not simplifying answers fully',
      'Confusing factorising with expanding'
    ],
    tips: [
      'Always try factorising before using the quadratic formula',
      'Check your answers by substituting back into the original equation',
      'Remember that (x + a)(x + b) = x² + (a+b)x + ab',
      'Practice mental arithmetic to avoid calculation errors'
    ],
    relatedTopics: ['algebra', 'geometry', 'higher-geometry'],
    estimatedStudyTime: 180
  },
  {
    topicId: 'higher-geometry',
    title: 'Higher Geometry',
    description: 'Advanced geometric concepts including trigonometry, circles, and transformations.',
    difficulty: 'higher',
    learningObjectives: [
      'Use trigonometric ratios (sin, cos, tan)',
      'Apply the sine and cosine rules',
      'Calculate area of triangles using trigonometry',
      'Understand circle theorems',
      'Find arc length and sector area',
      'Apply transformations to shapes',
      'Use vectors in geometry',
      'Solve 3D geometry problems'
    ],
    keyConcepts: [
      {
        id: 'trigonometry',
        title: 'Trigonometric Ratios',
        description: 'Relationships between angles and sides in right-angled triangles.',
        formula: 'sin θ = opposite/hypotenuse\ncos θ = adjacent/hypotenuse\ntan θ = opposite/adjacent',
        rules: [
          'SOHCAHTOA helps remember the ratios',
          'Use inverse functions to find angles',
          'Apply to any right-angled triangle'
        ]
      },
      {
        id: 'circle-theorems',
        title: 'Circle Theorems',
        description: 'Properties and relationships in circles.',
        rules: [
          'Angles in semicircle are 90°',
          'Angles in same segment are equal',
          'Opposite angles in cyclic quadrilateral sum to 180°',
          'Tangent is perpendicular to radius'
        ]
      }
    ],
    examples: [
      {
        id: 'ex1',
        title: 'Finding Missing Side with Trigonometry',
        question: 'In a right-angled triangle, angle A = 30° and hypotenuse = 10cm. Find the opposite side.',
        solution: '5 cm',
        working: 'sin 30° = opposite/hypotenuse\n0.5 = opposite/10\nOpposite = 10 × 0.5 = 5 cm',
        explanation: 'Use sin ratio: sin θ = opposite/hypotenuse, then rearrange to find opposite.',
        difficulty: 'intermediate'
      },
      {
        id: 'ex2',
        title: 'Area of Sector',
        question: 'Find the area of a sector with radius 6cm and angle 60°.',
        solution: '18.85 cm²',
        working: 'Area = (60/360) × π × 6² = (1/6) × π × 36 = 6π ≈ 18.85 cm²',
        explanation: 'Use formula: area = (θ/360) × πr².',
        difficulty: 'intermediate'
      }
    ],
    practiceQuestions: [
      {
        id: 'pq1',
        question: 'Calculate sin(45°)',
        marks: 1,
        difficulty: 'basic',
        questionType: 'short-answer',
        correctAnswer: '0.707',
        explanation: 'sin(45°) = 1/√2 ≈ 0.707',
        working: 'sin(45°) = 1/√2 ≈ 0.707',
        hints: ['Remember the exact value for 45°', 'Use calculator or memorise common values']
      },
      {
        id: 'pq2',
        question: 'Find the area of a triangle with sides 5cm, 12cm and 13cm',
        marks: 3,
        difficulty: 'intermediate',
        questionType: 'short-answer',
        correctAnswer: '30',
        explanation: 'This is a right-angled triangle (5² + 12² = 13²). Area = ½ × 5 × 12 = 30 cm²',
        working: '5² + 12² = 25 + 144 = 169 = 13²\nArea = ½ × 5 × 12 = 30 cm²',
        hints: ['Check if it\'s a right-angled triangle first', 'Use Pythagoras\' theorem']
      }
    ],
    commonMistakes: [
      'Using wrong trigonometric ratio for the given information',
      'Forgetting to convert angles to radians when using calculator',
      'Not checking if triangle is right-angled before using trig ratios',
      'Making arithmetic errors in multi-step calculations'
    ],
    tips: [
      'Always draw a diagram for geometry problems',
      'Label angles and sides clearly',
      'Remember common exact values (30°, 45°, 60°)',
      'Use estimation to verify your answers'
    ],
    relatedTopics: ['geometry', 'higher-algebra', 'statistics'],
    estimatedStudyTime: 200
  }
];
