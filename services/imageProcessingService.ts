const sharp = require('sharp');
const { MathpixService } = require('./mathpixService');

// Debug: Check if MathpixService was imported correctly
console.log('🔍 DEBUG: MathpixService imported:', !!MathpixService);
console.log('🔍 DEBUG: MathpixService type:', typeof MathpixService);
console.log('🔍 DEBUG: MathpixService methods:', Object.keys(MathpixService || {}));

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  confidence?: number;
}

export interface ProcessedImage {
  boundingBoxes: BoundingBox[];
  ocrText: string;
  imageDimensions: {
    width: number;
    height: number;
  };
}

export class ImageProcessingService {
  /**
   * Process an image to extract bounding boxes and OCR text
   * Using Mathpix API as the only OCR method - no fallbacks
   * Throws an error if Mathpix is not available or fails
   */
  static async processImage(imageData: string): Promise<ProcessedImage> {
    console.log('🔍 ===== IMAGE PROCESSING PIPELINE STARTED =====');
    
    // Debug: Check if MathpixService was imported correctly
    console.log('🔍 DEBUG: MathpixService imported:', !!MathpixService);
    console.log('🔍 DEBUG: MathpixService type:', typeof MathpixService);
    console.log('🔍 DEBUG: MathpixService methods:', Object.keys(MathpixService || {}));
    
    console.log('🔍 Input image data length:', imageData.length);
    console.log('🔍 Input image format:', imageData.substring(0, 30) + '...');
    
    // Step 1: Check Mathpix availability
    console.log('🔍 Step 1: Checking Mathpix availability...');
    console.log('🔍 MathpixService.isAvailable():', MathpixService.isAvailable());
    console.log('🔍 Environment check - MATHPIX_API_KEY exists:', !!process.env.MATHPIX_API_KEY);
    console.log('🔍 Environment check - MATHPIX_API_KEY length:', process.env.MATHPIX_API_KEY ? process.env.MATHPIX_API_KEY.length : 'undefined');
    
    if (!MathpixService.isAvailable()) {
      const error = new Error('Mathpix API is not available. Please check your API key and configuration.');
      console.error('🔍 ❌ Mathpix API not available:', error.message);
      throw error;
    }
    
    // Step 2: Attempt Mathpix OCR
    console.log('🔍 Step 2: Attempting Mathpix OCR...');
    console.log('🔍 Sending original image to Mathpix API (no preprocessing)...');
    
    let mathpixResult: any;
    try {
      mathpixResult = await MathpixService.performOCR(imageData);
      console.log('🔍 ✅ Mathpix OCR successful!');
    } catch (mathpixError) {
      const error = new Error(`Mathpix OCR failed: ${mathpixError instanceof Error ? mathpixError.message : 'Unknown error'}`);
      console.error('🔍 ❌ Mathpix OCR failed:', error.message);
      throw error;
    }
    
    // Step 3: Validate Mathpix results
    if (!mathpixResult || !mathpixResult.boundingBoxes) {
      const error = new Error('Mathpix OCR returned invalid or empty results');
      console.error('🔍 ❌ Invalid Mathpix results:', mathpixResult);
      throw error;
    }
    
    // Step 4: Process Mathpix results
    console.log('🔍 Step 4: Processing Mathpix OCR results');
    console.log('🔍 Mathpix text preview:', mathpixResult.text.substring(0, 200) + '...');
    
    // Convert Mathpix bounding boxes to our format
    const boundingBoxes = mathpixResult.boundingBoxes.map((bbox: any) => {
      // Handle Mathpix's contour format: cnt = [[x,y]] - contour points for the word
      if (bbox.cnt && Array.isArray(bbox.cnt) && bbox.cnt.length > 0) {
        const points = bbox.cnt as number[][];
        const x = Math.min(...points.map((p: number[]) => p[0]));
        const y = Math.min(...points.map((p: number[]) => p[1]));
        const width = Math.max(...points.map((p: number[]) => p[0])) - x;
        const height = Math.max(...points.map((p: number[]) => p[1])) - y;
        
        return {
          x,
          y,
          width,
          height,
          text: bbox.text,
          confidence: bbox.confidence
        };
      } else {
        // Fallback to legacy format if available
        return {
          x: bbox.x || 0,
          y: bbox.y || 0,
          width: bbox.width || 0,
          height: bbox.height || 0,
          text: bbox.text,
          confidence: bbox.confidence
        };
      }
    });
    
    // Get image dimensions
    const imageBuffer = await this.readImage(imageData);
    const imageDimensions = await this.getImageDimensions(imageBuffer);
    
    console.log('🔍 ===== MATHPIX OCR RESULT =====');
    console.log(`🔍 Total bounding boxes: ${boundingBoxes.length}`);
    console.log(`🔍 OCR text length: ${mathpixResult.text.length} characters`);
    console.log(`🔍 OCR confidence: ${(mathpixResult.confidence * 100).toFixed(2)}%`);
    console.log(`🔍 Image dimensions: ${imageDimensions.width}x${imageDimensions.height}`);
    
    return { 
      boundingBoxes, 
      ocrText: mathpixResult.text, 
      imageDimensions 
    };
  }

  /**
   * Step 1: Read the Image and convert to buffer
   */
  private static async readImage(imageData: string): Promise<Buffer> {
    try {
      // Convert base64 to buffer
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      if (buffer.length === 0) {
        throw new Error('Failed to convert image data to buffer');
      }
      
      return buffer;
    } catch (error) {
      throw new Error(`Failed to read image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get image dimensions using Sharp
   */
  private static async getImageDimensions(imageBuffer: Buffer): Promise<{ width: number; height: number }> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      return {
        width: metadata.width || 800,
        height: metadata.height || 600
      };
    } catch (error) {
      return { width: 800, height: 600 };
    }
  }

  /**
   * Enhance bounding boxes with OCR text for each region
   * Since we only use Mathpix now, this method is simplified
   */
  static async enhanceBoundingBoxesWithOCR(imageData: string, boundingBoxes: BoundingBox[]): Promise<BoundingBox[]> {
    try {
      const enhancedBoxes: BoundingBox[] = [];
      
      if (boundingBoxes.length === 0) {
        return [];
      }
      
      // Since we're using Mathpix, the bounding boxes already have text
      // Just return them as-is for now
      return boundingBoxes;
      
    } catch (error) {
      return boundingBoxes; // Return original boxes if enhancement fails
    }
  }

  /**
   * Filter bounding boxes to focus on mathematical content
   */
  static filterMathematicalContent(boundingBoxes: BoundingBox[]): BoundingBox[] {
    return boundingBoxes.filter(bbox => {
      if (!bbox.text) return false;
      
      const text = bbox.text.toLowerCase();
      
      // Look for mathematical symbols and patterns
      const mathPatterns = [
        /\d+/, // Numbers
        /[+\-*/=<>≤≥≠±√∫∑∏∂∞θπ]/g, // Math symbols
        /[a-z]/, // Variables
        /\(\)/, // Parentheses
        /[xyzw]/, // Common variables
        /sin|cos|tan|log|ln|exp/, // Math functions
      ];
      
      return mathPatterns.some(pattern => pattern.test(text));
    });
  }

  /**
   * Filter out question text and keep only answer text
   */
  static filterAnswerText(boundingBoxes: BoundingBox[]): BoundingBox[] {
    return boundingBoxes.filter(bbox => {
      if (!bbox.text) return false;
      
      const text = bbox.text.toLowerCase().trim();
      
      // Skip if text is too short
      if (text.length < 2) return false;
      
      // Skip common question indicators
      const questionPatterns = [
        /^question\s*\d*/, // "Question 1", "Question", etc.
        /^q\.?\s*\d*/, // "Q1", "Q.", etc.
        /^problem\s*\d*/, // "Problem 1", etc.
        /^p\.?\s*\d*/, // "P1", "P.", etc.
        /^exercise\s*\d*/, // "Exercise 1", etc.
        /^e\.?\s*\d*/, // "E1", "E.", etc.
        /^find\s+/, // "Find the value of..."
        /^calculate\s+/, // "Calculate..."
        /^solve\s+/, // "Solve for..."
        /^determine\s+/, // "Determine..."
        /^show\s+/, // "Show that..."
        /^prove\s+/, // "Prove that..."
        /^what\s+is/, // "What is..."
        /^how\s+many/, // "How many..."
        /^if\s+/, // "If x = 5..."
        /^given\s+/, // "Given that..."
        /^suppose\s+/, // "Suppose..."
        /^let\s+/, // "Let x be..."
        /^consider\s+/, // "Consider..."
        /^assume\s+/, // "Assume..."
        /^a\)/, /^b\)/, /^c\)/, /^d\)/, // Multiple choice options
        /^i\)/, /^ii\)/, /^iii\)/, /^iv\)/, // Roman numeral options
        /^1\)/, /^2\)/, /^3\)/, /^4\)/, // Numbered options
        /^part\s*[a-z]/, // "Part a", "Part b", etc.
        /^section\s*\d*/, // "Section 1", etc.
        /^chapter\s*\d*/, // "Chapter 1", etc.
        /^page\s*\d*/, // "Page 1", etc.
        /^total\s+marks/, // "Total marks: 10"
        /^marks\s*:/, // "Marks: 5"
        /^time\s*:/, // "Time: 30 minutes"
        /^duration\s*:/, // "Duration: 1 hour"
        /^name\s*:/, // "Name: John Doe"
        /^student\s+id/, // "Student ID: 12345"
        /^class\s*:/, // "Class: Math 101"
        /^date\s*:/, // "Date: 2024-01-01"
        /^instructor\s*:/, // "Instructor: Dr. Smith"
        /^course\s*:/, // "Course: Advanced Calculus"
        /^exam\s*:/, // "Exam: Final"
        /^test\s*:/, // "Test: Midterm"
        /^homework\s*:/, // "Homework: Assignment 1"
        /^assignment\s*:/, // "Assignment: Problem Set 2"
      ];
      
      // Skip if text matches question patterns
      if (questionPatterns.some(pattern => pattern.test(text))) {
        return false;
      }
      
      // Skip if text contains mostly question words
      const questionWords = [
        'question', 'problem', 'exercise', 'find', 'calculate', 'solve', 
        'determine', 'show', 'prove', 'what', 'how', 'if', 'given', 
        'suppose', 'let', 'consider', 'assume', 'total', 'marks', 
        'time', 'duration', 'name', 'student', 'class', 'date', 
        'instructor', 'course', 'exam', 'test', 'homework', 'assignment'
      ];
      
      const words = text.split(/\s+/);
      const questionWordCount = words.filter(word => 
        questionWords.some(qWord => word.includes(qWord))
      ).length;
      
      // If more than 50% of words are question-related, skip it
      if (questionWordCount / words.length > 0.5) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Cleanup resources and terminate any active workers
   */
  static async cleanup(): Promise<void> {
    try {
      console.log('🔍 Cleaning up image processing resources...');
      // This method can be used to clean up any resources if needed
      console.log('🔍 Cleanup completed');
    } catch (error) {
      console.warn('🔍 Cleanup warning:', error);
    }
  }
}
