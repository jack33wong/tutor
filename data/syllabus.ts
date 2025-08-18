export interface Topic {
  id: string;
  name: string;
  description: string;
  subtopics: Subtopic[];
  difficulty: 'foundation' | 'higher';
  estimatedHours: number;
}

export interface Subtopic {
  id: string;
  name: string;
  description: string;
  learningObjectives: string[];
  difficulty: 'foundation' | 'higher';
}

export const gcseMathsSyllabus: Topic[] = [
  {
    id: 'number',
    name: 'Number',
    description: 'Understanding and working with numbers, including fractions, decimals, percentages, and ratios.',
    difficulty: 'foundation',
    estimatedHours: 20,
    subtopics: [
      {
        id: 'number-basic',
        name: 'Basic Number Skills',
        description: 'Place value, ordering, rounding, and estimation',
        difficulty: 'foundation',
        learningObjectives: [
          'Understand place value for numbers up to 10 million',
          'Order positive and negative numbers',
          'Round numbers to a given number of decimal places',
          'Use estimation to check calculations'
        ]
      },
      {
        id: 'number-fractions',
        name: 'Fractions, Decimals and Percentages',
        description: 'Converting between fractions, decimals and percentages',
        difficulty: 'foundation',
        learningObjectives: [
          'Convert between fractions, decimals and percentages',
          'Add, subtract, multiply and divide fractions',
          'Find fractions of amounts',
          'Calculate percentage increase and decrease'
        ]
      },
      {
        id: 'number-ratio',
        name: 'Ratio and Proportion',
        description: 'Understanding and using ratios and proportions',
        difficulty: 'foundation',
        learningObjectives: [
          'Write ratios in simplest form',
          'Divide amounts in given ratios',
          'Solve problems involving direct proportion',
          'Use scale factors and maps'
        ]
      }
    ]
  },
  {
    id: 'algebra',
    name: 'Algebra',
    description: 'Using letters and symbols to represent numbers and quantities in formulae, equations, and expressions.',
    difficulty: 'foundation',
    estimatedHours: 25,
    subtopics: [
      {
        id: 'algebra-expressions',
        name: 'Expressions and Formulae',
        description: 'Simplifying expressions and using formulae',
        difficulty: 'foundation',
        learningObjectives: [
          'Simplify algebraic expressions',
          'Substitute numbers into formulae',
          'Change the subject of a formula',
          'Expand and factorise expressions'
        ]
      },
      {
        id: 'algebra-equations',
        name: 'Equations and Inequalities',
        description: 'Solving linear equations and inequalities',
        difficulty: 'foundation',
        learningObjectives: [
          'Solve linear equations with one unknown',
          'Solve equations with brackets',
          'Solve simple inequalities',
          'Solve simultaneous equations'
        ]
      },
      {
        id: 'algebra-sequences',
        name: 'Sequences',
        description: 'Understanding and generating number sequences',
        difficulty: 'foundation',
        learningObjectives: [
          'Generate arithmetic sequences',
          'Find the nth term of a sequence',
          'Recognise geometric sequences',
          'Find missing terms in sequences'
        ]
      }
    ]
  },
  {
    id: 'geometry',
    name: 'Geometry and Measures',
    description: 'Properties of shapes, angles, area, perimeter, volume, and transformations.',
    difficulty: 'foundation',
    estimatedHours: 30,
    subtopics: [
      {
        id: 'geometry-angles',
        name: 'Angles and Shapes',
        description: 'Properties of angles and geometric shapes',
        difficulty: 'foundation',
        learningObjectives: [
          'Calculate angles in triangles and quadrilaterals',
          'Understand angle properties of parallel lines',
          'Recognise and name 2D and 3D shapes',
          'Use angle facts to solve problems'
        ]
      },
      {
        id: 'geometry-area',
        name: 'Area and Perimeter',
        description: 'Calculating area and perimeter of shapes',
        difficulty: 'foundation',
        learningObjectives: [
          'Calculate area and perimeter of rectangles and triangles',
          'Find area and circumference of circles',
          'Calculate area of compound shapes',
          'Solve problems involving area and perimeter'
        ]
      },
      {
        id: 'geometry-volume',
        name: 'Volume and Surface Area',
        description: 'Calculating volume and surface area of 3D shapes',
        difficulty: 'foundation',
        learningObjectives: [
          'Calculate volume of cuboids and prisms',
          'Find surface area of 3D shapes',
          'Calculate volume and surface area of cylinders',
          'Solve problems involving volume and capacity'
        ]
      }
    ]
  },
  {
    id: 'statistics',
    name: 'Statistics and Probability',
    description: 'Collecting, presenting, and interpreting data, and understanding probability.',
    difficulty: 'foundation',
    estimatedHours: 20,
    subtopics: [
      {
        id: 'statistics-data',
        name: 'Data Handling',
        description: 'Collecting, presenting and interpreting data',
        difficulty: 'foundation',
        learningObjectives: [
          'Design and use data collection sheets',
          'Draw and interpret frequency tables',
          'Calculate mean, median, mode and range',
          'Interpret pie charts and bar charts'
        ]
      },
      {
        id: 'statistics-probability',
        name: 'Probability',
        description: 'Understanding and calculating probability',
        difficulty: 'foundation',
        learningObjectives: [
          'Calculate probability of single events',
          'Use probability scale from 0 to 1',
          'Find probability of combined events',
          'Use tree diagrams for probability'
        ]
      }
    ]
  },
  {
    id: 'higher-algebra',
    name: 'Higher Algebra',
    description: 'Advanced algebraic techniques including quadratics, functions, and graphs.',
    difficulty: 'higher',
    estimatedHours: 25,
    subtopics: [
      {
        id: 'higher-quadratics',
        name: 'Quadratic Equations',
        description: 'Solving quadratic equations and inequalities',
        difficulty: 'higher',
        learningObjectives: [
          'Factorise quadratic expressions',
          'Solve quadratic equations by factorising',
          'Use the quadratic formula',
          'Complete the square'
        ]
      },
      {
        id: 'higher-graphs',
        name: 'Graphs and Functions',
        description: 'Drawing and interpreting graphs of functions',
        difficulty: 'higher',
        learningObjectives: [
          'Draw graphs of linear and quadratic functions',
          'Find gradients and intercepts',
          'Solve equations using graphs',
          'Understand function notation'
        ]
      }
    ]
  },
  {
    id: 'higher-geometry',
    name: 'Higher Geometry',
    description: 'Advanced geometric concepts including trigonometry, vectors, and circle theorems.',
    difficulty: 'higher',
    estimatedHours: 30,
    subtopics: [
      {
        id: 'higher-trigonometry',
        name: 'Trigonometry',
        description: 'Using sine, cosine and tangent ratios',
        difficulty: 'higher',
        learningObjectives: [
          'Use sine, cosine and tangent ratios',
          'Find missing sides and angles in right-angled triangles',
          'Use the sine and cosine rules',
          'Find area of triangles using trigonometry'
        ]
      },
      {
        id: 'higher-circles',
        name: 'Circle Theorems',
        description: 'Understanding and applying circle theorems',
        difficulty: 'higher',
        learningObjectives: [
          'Understand angle properties of circles',
          'Use circle theorems to find missing angles',
          'Apply circle theorems to solve problems',
          'Understand tangent properties'
        ]
      }
    ]
  }
];
