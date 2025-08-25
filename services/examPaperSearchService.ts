import { examPaperService } from './examPaperService';

export interface ExternalExamPaper {
  id: string;
  title: string;
  examBoard: string;
  year: number;
  paper: string;
  level: 'GCSE' | 'A-Level';
  difficulty: 'Foundation' | 'Higher';
  topics: string[];
  questionCount: number;
  totalMarks: number;
  source: string;
  available: boolean;
  downloadUrl?: string;
  previewUrl?: string;
}

export interface SearchResult {
  papers: ExternalExamPaper[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface ImportResult {
  success: boolean;
  paperId?: string;
  questionsImported: number;
  topics: string[];
  difficulty: string;
  error?: string;
}

export class ExamPaperSearchService {
  // Mock external API endpoints - replace with real API endpoints
  private static readonly MOCK_APIS = {
    'AQA': 'https://api.aqa.org.uk/exam-papers',
    'Edexcel': 'https://api.edexcel.com/papers',
    'OCR': 'https://api.ocr.org.uk/exam-papers',
    'WJEC': 'https://api.wjec.co.uk/papers',
    'CCEA': 'https://api.ccea.org.uk/exam-papers',
    'Pearson': 'https://api.pearson.com/papers',
    'Cambridge': 'https://api.cambridge.org/exam-papers'
  };

  /**
   * Search for exam papers from external sources
   */
  static async searchExamPapers(
    examBoard: string,
    year: number,
    paper?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<SearchResult> {
    try {
      console.log(`🔍 Searching for ${examBoard} ${year} papers...`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock search results - replace with actual API calls
      const mockResults = this.generateMockResults(examBoard, year, paper, page, limit);
      
      console.log(`✅ Found ${mockResults.papers.length} papers`);
      return mockResults;
      
    } catch (error) {
      console.error('❌ Search failed:', error);
      throw new Error(`Failed to search for exam papers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import a single exam paper from external source to database
   */
  static async importExamPaper(externalPaper: ExternalExamPaper): Promise<ImportResult> {
    try {
      console.log(`📥 Importing exam paper: ${externalPaper.title}`);
      
      // Simulate fetching full paper content from external API
      const fullPaperContent = await this.fetchFullPaperContent(externalPaper);
      
      // Create the exam paper structure for our database
      const examPaperData = {
        title: externalPaper.title,
        year: externalPaper.year,
        level: externalPaper.level,
        difficulty: (externalPaper.difficulty === 'Foundation' ? 'foundation' : 'higher') as 'foundation' | 'higher',
        totalMarks: externalPaper.totalMarks,
        timeLimit: 90, // Default time limit
        questions: [], // Will be populated by importQuestionsFromPaper
        examBoard: externalPaper.examBoard as 'AQA' | 'Edexcel' | 'OCR' | 'WJEC',
        paperType: 'Paper 1' as 'Paper 1' | 'Paper 2' | 'Paper 3', // Default paper type
        calculator: true // Default calculator allowed
      };

      // Save to database using existing service
      const paperId = await examPaperService.addExamPaper(examPaperData);
      
      if (!paperId) {
        throw new Error('Failed to save exam paper to database');
      }

      // Import individual questions (mock data for now)
      const questionsImported = await this.importQuestionsFromPaper(
        paperId, 
        externalPaper, 
        fullPaperContent
      );

      console.log(`✅ Successfully imported ${externalPaper.title}`);
      
      return {
        success: true,
        paperId,
        questionsImported,
        topics: externalPaper.topics,
        difficulty: externalPaper.difficulty
      };
      
    } catch (error) {
      console.error('❌ Import failed:', error);
      return {
        success: false,
        questionsImported: 0,
        topics: [],
        difficulty: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Bulk import multiple exam papers
   */
  static async bulkImportExamPapers(papers: ExternalExamPaper[]): Promise<{
    success: boolean;
    imported: number;
    failed: number;
    results: ImportResult[];
  }> {
    const results: ImportResult[] = [];
    let imported = 0;
    let failed = 0;

    console.log(`📥 Starting bulk import of ${papers.length} exam papers`);

    for (let i = 0; i < papers.length; i++) {
      const paper = papers[i];
      console.log(`Importing ${i + 1}/${papers.length}: ${paper.title}`);
      
      try {
        const result = await this.importExamPaper(paper);
        results.push(result);
        
        if (result.success) {
          imported++;
        } else {
          failed++;
        }
        
        // Small delay between imports to avoid overwhelming external APIs
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Failed to import ${paper.title}:`, error);
        results.push({
          success: false,
          questionsImported: 0,
          topics: [],
          difficulty: '',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        failed++;
      }
    }

    console.log(`✅ Bulk import completed: ${imported} successful, ${failed} failed`);
    
    return {
      success: failed === 0,
      imported,
      failed,
      results
    };
  }

  /**
   * Check if external API is available
   */
  static async checkApiAvailability(examBoard: string): Promise<boolean> {
    try {
      // Simulate API health check
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock availability - replace with actual health check
      const available = Math.random() > 0.1; // 90% availability
      
      console.log(`🌐 ${examBoard} API availability: ${available ? 'Available' : 'Unavailable'}`);
      return available;
      
    } catch (error) {
      console.error(`❌ Failed to check ${examBoard} API availability:`, error);
      return false;
    }
  }

  /**
   * Get available exam boards
   */
  static getAvailableExamBoards(): string[] {
    return Object.keys(this.MOCK_APIS);
  }

  /**
   * Get supported years
   */
  static getSupportedYears(): number[] {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 15 }, (_, i) => currentYear - i);
  }

  /**
   * Get supported paper types
   */
  static getSupportedPaperTypes(): string[] {
    return ['1F', '1H', '2F', '2H', '3F', '3H'];
  }

  // Private helper methods

  private static generateMockResults(
    examBoard: string, 
    year: number, 
    paper?: string, 
    page: number = 1, 
    limit: number = 10
  ): SearchResult {
    const papers: ExternalExamPaper[] = [];
    const baseId = `${examBoard}-${year}-${paper || 'any'}`;
    
    // Generate mock papers based on search criteria
    const paperTypes = paper ? [paper] : ['1F', '1H', '2F', '2H'];
    
    paperTypes.forEach((paperType, index) => {
      if (papers.length >= limit) return;
      
      const difficulty = paperType.endsWith('H') ? 'Higher' : 'Foundation';
      const topics = this.getMockTopics(difficulty);
      
      // Special cases for specific exam papers with different question counts
      let questionCount = difficulty === 'Higher' ? 25 : 20;
      let totalMarks = difficulty === 'Higher' ? 80 : 60;
      
      if (examBoard === 'AQA' && year === 2023 && paperType === '2H') {
        questionCount = 26;
        totalMarks = 80; // AQA 2023 Paper 2H has 26 questions
      } else if (examBoard === 'AQA' && year === 2023 && paperType === '1H') {
        questionCount = 30; // AQA 2023 Paper 1H has 30 questions
        totalMarks = 80;
      }
      
      papers.push({
        id: `${baseId}-${paperType}-${index + 1}`,
        title: `${examBoard} ${year} Paper ${paperType}`,
        examBoard,
        year,
        paper: paperType,
        level: 'GCSE', // Default to GCSE for mock data
        difficulty,
        topics,
        questionCount,
        totalMarks,
        source: 'External API',
        available: true,
        downloadUrl: `https://example.com/download/${examBoard}/${year}/${paperType}`,
        previewUrl: `https://example.com/preview/${examBoard}/${year}/${paperType}`
      });
    });

    return {
      papers,
      total: papers.length,
      page,
      hasMore: false
    };
  }

  private static getMockTopics(difficulty: string): string[] {
    const allTopics = [
      'Number', 'Algebra', 'Geometry', 'Statistics', 'Probability',
      'Trigonometry', 'Calculus', 'Vectors', 'Functions', 'Sequences'
    ];
    
    if (difficulty === 'Foundation') {
      return allTopics.slice(0, 4); // Basic topics
    } else {
      return allTopics.slice(0, 7); // Advanced topics
    }
  }

  private static async fetchFullPaperContent(paper: ExternalExamPaper): Promise<any> {
    // Simulate fetching full content from external API
    console.log(`📄 Fetching full content for ${paper.title}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock full paper content
    return {
      questions: Array.from({ length: paper.questionCount }, (_, i) => ({
        id: `q-${i + 1}`,
        questionNumber: i + 1,
        questionText: `Mock question ${i + 1} for ${paper.title}`,
        marks: Math.floor(Math.random() * 4) + 1,
        topic: paper.topics[Math.floor(Math.random() * paper.topics.length)],
        difficulty: paper.difficulty
      })),
      markScheme: {
        available: true,
        url: `https://example.com/markscheme/${paper.examBoard}/${paper.year}/${paper.paper}`
      },
      examinerReport: {
        available: true,
        url: `https://example.com/report/${paper.examBoard}/${paper.year}/${paper.paper}`
      }
    };
  }

  private static async importQuestionsFromPaper(
    paperId: string, 
    externalPaper: ExternalExamPaper, 
    fullContent: any
  ): Promise<number> {
    try {
      console.log(`📝 Importing ${fullContent.questions.length} questions for paper ${paperId}`);
      
      let importedCount = 0;
      
      for (const question of fullContent.questions) {
        try {
          const questionData = {
            examBoard: externalPaper.examBoard,
            year: externalPaper.year,
            paper: externalPaper.paper,
            level: externalPaper.level,
            questionNumber: question.questionNumber,
            question: question.questionText,
            category: 'General',
            marks: question.marks,
            topic: question.topic,
            difficulty: externalPaper.difficulty
          };

          await examPaperService.addPastExamQuestion(questionData);
          importedCount++;
          
        } catch (error) {
          console.error(`Failed to import question ${question.id}:`, error);
        }
      }
      
      console.log(`✅ Imported ${importedCount}/${fullContent.questions.length} questions`);
      return importedCount;
      
    } catch (error) {
      console.error('❌ Failed to import questions:', error);
      return 0;
    }
  }
}
