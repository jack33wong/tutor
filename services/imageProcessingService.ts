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

export interface PreprocessingOptions {
  cropRegion?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  targetWidth?: number;
  targetHeight?: number;
  enhanceContrast?: boolean;
  sharpen?: boolean;
  denoise?: boolean;
  deskew?: boolean;
  threshold?: boolean;
  quality?: number;
}

export class ImageProcessingService {
  /**
   * Preprocess image for better OCR results before sending to MathPix API
   * This function creates a new processed image without modifying the original
   * 
   * TEMPORARILY DISABLED - This method is not being called during image processing
   */
  static async preprocessImageForOCR(
    imageBuffer: Buffer, 
    options: PreprocessingOptions = {}
  ): Promise<Buffer> {
    console.log('🔍 ===== IMAGE PREPROCESSING STARTED =====');
    
    try {
      let processedImage = sharp(imageBuffer);
      
      // Step 1: Crop to region of interest if specified
      if (options.cropRegion) {
        console.log('🔍 Cropping image to region of interest...');
        const { x, y, width, height } = options.cropRegion;
        processedImage = processedImage.extract({ left: x, top: y, width, height });
        console.log(`🔍 Cropped to: ${width}x${height} at (${x}, ${y})`);
      }
      
      // Step 2: Deskew/rotate if requested
      if (options.deskew) {
        console.log('🔍 Attempting to deskew image...');
        // Sharp doesn't have built-in deskew, but we can try to detect and correct rotation
        // This is a simplified approach - for more advanced deskewing, consider using OpenCV
        processedImage = processedImage.rotate(0, { background: { r: 255, g: 255, b: 255, alpha: 1 } });
        console.log('🔍 Applied rotation correction');
      }
      
      // Step 3: Enhance contrast and brightness for faint handwriting
      if (options.enhanceContrast) {
        console.log('🔍 Enhancing contrast and brightness...');
        processedImage = processedImage
          .linear(1.2, -0.1) // Increase contrast and adjust brightness
          .modulate({ brightness: 1.1, saturation: 0.8 }); // Brighten and reduce saturation
        console.log('🔍 Contrast and brightness enhanced');
      }
      
      // Step 4: Sharpen for better text clarity
      if (options.sharpen) {
        console.log('🔍 Applying sharpening filter...');
        processedImage = processedImage.sharpen({
          sigma: 1.5,
          flat: 1.0,
          jagged: 2.0
        });
        console.log('🔍 Sharpening applied');
      }
      
      // Step 5: Denoise and apply thresholding for pen/pencil
      if (options.denoise) {
        console.log('🔍 Applying denoising...');
        processedImage = processedImage.median(1); // Remove noise while preserving edges
        console.log('🔍 Denoising applied');
      }
      
      if (options.threshold) {
        console.log('🔍 Applying thresholding for pen/pencil...');
        // Convert to grayscale first, then apply threshold
        processedImage = processedImage
          .grayscale()
          .threshold(128); // Adjust threshold value as needed
        console.log('🔍 Thresholding applied');
      }
      
      // Step 6: Resize to higher resolution while keeping file size reasonable
      if (options.targetWidth || options.targetHeight) {
        console.log('🔍 Resizing image...');
        const resizeOptions: any = {};
        
        if (options.targetWidth && options.targetHeight) {
          resizeOptions.width = options.targetWidth;
          resizeOptions.height = options.targetHeight;
        } else if (options.targetWidth) {
          resizeOptions.width = options.targetWidth;
          resizeOptions.height = null; // Maintain aspect ratio
        } else if (options.targetHeight) {
          resizeOptions.height = options.targetHeight;
          resizeOptions.width = null; // Maintain aspect ratio
        }
        
        processedImage = processedImage.resize(resizeOptions, {
          kernel: 'lanczos3', // High-quality resampling
          fit: 'inside' // Ensure image fits within bounds
        });
        
        console.log(`🔍 Resized to: ${options.targetWidth || 'auto'}x${options.targetHeight || 'auto'}`);
      }
      
      // Step 7: Optimize output format and quality
      const outputOptions: any = {
        format: 'jpeg',
        quality: options.quality || 90,
        progressive: true,
        mozjpeg: true // Better compression
      };
      
      console.log('🔍 Finalizing processed image...');
      const processedBuffer = await processedImage
        .jpeg(outputOptions)
        .toBuffer();
      
      console.log(`🔍 ✅ Image preprocessing completed successfully!`);
      console.log(`🔍 Original size: ${imageBuffer.length} bytes`);
      console.log(`🔍 Processed size: ${processedBuffer.length} bytes`);
      console.log(`🔍 Size reduction: ${((1 - processedBuffer.length / imageBuffer.length) * 100).toFixed(1)}%`);
      
      return processedBuffer;
      
    } catch (error) {
      console.error('🔍 ❌ Image preprocessing failed:', error);
      // Return original image if preprocessing fails
      return imageBuffer;
    }
  }

  /**
   * Smart cropping to detect and crop to the main content area
   * Uses edge detection to find the boundaries of written content
   */
  static async detectContentRegion(imageBuffer: Buffer): Promise<{
    x: number;
    y: number;
    width: number;
    height: number;
  }> {
    try {
      console.log('🔍 Detecting content region automatically...');
      
      // Get image metadata
      const metadata = await sharp(imageBuffer).metadata();
      const { width = 800, height = 600 } = metadata;
      
      // For now, return a centered region that's 80% of the image
      // In a more advanced implementation, you could use edge detection
      const marginX = Math.floor(width * 0.1);
      const marginY = Math.floor(height * 0.1);
      const cropWidth = width - (2 * marginX);
      const cropHeight = height - (2 * marginY);
      
      const region = {
        x: marginX,
        y: marginY,
        width: cropWidth,
        height: cropHeight
      };
      
      console.log(`🔍 Auto-detected region: ${cropWidth}x${cropHeight} at (${marginX}, ${marginY})`);
      return region;
      
    } catch (error) {
      console.error('🔍 ❌ Content region detection failed:', error);
      // Return full image if detection fails
      return { x: 0, y: 0, width: 800, height: 600 };
    }
  }

  /**
   * Enhanced image processing with automatic optimization
   * Automatically detects the best preprocessing parameters
   */
  static async autoPreprocessImage(imageBuffer: Buffer): Promise<Buffer> {
    console.log('🔍 ===== AUTO PREPROCESSING STARTED =====');
    
    try {
      // Get image metadata to determine optimal settings
      const metadata = await sharp(imageBuffer).metadata();
      const { width = 800, height = 600, format } = metadata;
      
      console.log(`🔍 Image metadata: ${width}x${height}, format: ${format}`);
      
      // Determine optimal preprocessing based on image characteristics
      const options: PreprocessingOptions = {
        enhanceContrast: true, // Always enhance contrast for OCR
        sharpen: true, // Always sharpen for text clarity
        denoise: true, // Always denoise
        threshold: false, // Don't threshold by default (preserves color information)
        quality: 90
      };
      
      // Auto-detect content region for cropping
      const contentRegion = await this.detectContentRegion(imageBuffer);
      options.cropRegion = contentRegion;
      
      // Determine optimal resolution
      if (width < 1200 || height < 1600) {
        // Upscale smaller images for better OCR
        options.targetWidth = Math.max(1200, width);
        options.targetHeight = Math.max(1600, height);
        console.log(`🔍 Upscaling to: ${options.targetWidth}x${options.targetHeight}`);
      } else if (width > 2400 || height > 3200) {
        // Downscale very large images to keep file size reasonable
        options.targetWidth = Math.min(2400, width);
        options.targetHeight = Math.min(3200, height);
        console.log(`🔍 Downscaling to: ${options.targetWidth}x${options.targetHeight}`);
      }
      
      // Apply preprocessing
      const processedBuffer = await this.preprocessImageForOCR(imageBuffer, options);
      
      console.log('🔍 ✅ Auto preprocessing completed successfully!');
      return processedBuffer;
      
    } catch (error) {
      console.error('🔍 ❌ Auto preprocessing failed:', error);
      return imageBuffer; // Return original if auto preprocessing fails
    }
  }

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
    
    // Step 2: Preprocess image for better OCR results (TEMPORARILY DISABLED)
    console.log('🔍 Step 2: Image preprocessing TEMPORARILY DISABLED - using original image');
    const imageBuffer = await this.readImage(imageData);
    // const preprocessedBuffer = await this.autoPreprocessImage(imageBuffer); // TEMPORARILY DISABLED
    
    // Use original image instead of preprocessed
    const preprocessedBase64 = imageData; // Use original image data directly
    console.log('🔍 ✅ Using original image (preprocessing skipped)');
    
    // Step 3: Attempt Mathpix OCR with original image
    console.log('🔍 Step 3: Attempting Mathpix OCR with original image...');
    
    let mathpixResult: any;
    try {
      mathpixResult = await MathpixService.performOCR(preprocessedBase64);
      console.log('🔍 ✅ Mathpix OCR successful!');
    } catch (mathpixError) {
      const error = new Error(`Mathpix OCR failed: ${mathpixError instanceof Error ? mathpixError.message : 'Unknown error'}`);
      console.error('🔍 ❌ Mathpix OCR failed:', error.message);
      throw error;
    }
    
    // Step 4: Validate Mathpix results
    if (!mathpixResult || !mathpixResult.boundingBoxes) {
      const error = new Error('Mathpix OCR returned invalid or empty results');
      console.error('🔍 ❌ Invalid Mathpix results:', mathpixResult);
      throw error;
    }
    
    // Step 5: Process Mathpix results
    console.log('🔍 Step 5: Processing Mathpix OCR results');
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

  /**
   * Utility function to preprocess an image from base64 string
   * Useful for standalone preprocessing without going through the full OCR pipeline
   */
  static async preprocessBase64Image(
    base64Image: string, 
    options: PreprocessingOptions = {}
  ): Promise<string> {
    try {
      console.log('🔍 Preprocessing base64 image...');
      
      // Convert base64 to buffer
      const imageBuffer = await this.readImage(base64Image);
      
      // Apply preprocessing
      const processedBuffer = await this.preprocessImageForOCR(imageBuffer, options);
      
      // Convert back to base64
      const processedBase64 = `data:image/jpeg;base64,${processedBuffer.toString('base64')}`;
      
      console.log('🔍 ✅ Base64 image preprocessing completed');
      return processedBase64;
      
    } catch (error) {
      console.error('🔍 ❌ Base64 image preprocessing failed:', error);
      return base64Image; // Return original if preprocessing fails
    }
  }

  /**
   * Compare original and processed images to show improvements
   * Returns metadata about both images for comparison
   */
  static async compareImages(
    originalBuffer: Buffer, 
    processedBuffer: Buffer
  ): Promise<{
    original: { size: number; dimensions: { width: number; height: number } };
    processed: { size: number; dimensions: { width: number; height: number } };
    improvements: {
      sizeReduction: number;
      resolutionChange: string;
      formatChange: string;
    };
  }> {
    try {
      console.log('🔍 Comparing original vs processed images...');
      
      // Get metadata for both images
      const originalMetadata = await sharp(originalBuffer).metadata();
      const processedMetadata = await sharp(processedBuffer).metadata();
      
      const comparison = {
        original: {
          size: originalBuffer.length,
          dimensions: {
            width: originalMetadata.width || 0,
            height: originalMetadata.height || 0
          }
        },
        processed: {
          size: processedBuffer.length,
          dimensions: {
            width: processedMetadata.width || 0,
            height: processedMetadata.height || 0
          }
        },
        improvements: {
          sizeReduction: ((originalBuffer.length - processedBuffer.length) / originalBuffer.length) * 100,
          resolutionChange: `${originalMetadata.width || 0}x${originalMetadata.height || 0} → ${processedMetadata.width || 0}x${processedMetadata.height || 0}`,
          formatChange: `${originalMetadata.format || 'unknown'} → ${processedMetadata.format || 'unknown'}`
        }
      };
      
      console.log('🔍 ✅ Image comparison completed');
      return comparison;
      
    } catch (error) {
      console.error('🔍 ❌ Image comparison failed:', error);
      throw error;
    }
  }

  /**
   * Get detailed preprocessing statistics and recommendations
   * Analyzes the image and suggests optimal preprocessing parameters
   */
  static async analyzeImageForPreprocessing(imageBuffer: Buffer): Promise<{
    recommendations: PreprocessingOptions;
    analysis: {
      currentQuality: string;
      suggestedImprovements: string[];
      estimatedOcrImprovement: string;
    };
  }> {
    try {
      console.log('🔍 Analyzing image for preprocessing recommendations...');
      
      const metadata = await sharp(imageBuffer).metadata();
      const { width = 800, height = 600, format, size } = metadata;
      
      const recommendations: PreprocessingOptions = {
        enhanceContrast: true,
        sharpen: true,
        denoise: true,
        threshold: false,
        quality: 90
      };
      
      const analysis = {
        currentQuality: 'unknown',
        suggestedImprovements: [] as string[],
        estimatedOcrImprovement: 'moderate'
      };
      
      // Analyze image characteristics and make recommendations
      if (width < 1200 || height < 1600) {
        recommendations.targetWidth = Math.max(1200, width);
        recommendations.targetHeight = Math.max(1600, height);
        analysis.suggestedImprovements.push('Upscale for better OCR accuracy');
        analysis.estimatedOcrImprovement = 'high';
      }
      
      if (width > 2400 || height > 3200) {
        recommendations.targetWidth = Math.min(2400, width);
        recommendations.targetHeight = Math.min(3200, height);
        analysis.suggestedImprovements.push('Downscale to optimize file size');
      }
      
      if (format === 'png' || format === 'bmp') {
        analysis.suggestedImprovements.push('Convert to JPEG for better compression');
      }
      
      if (size && size > 5 * 1024 * 1024) { // > 5MB
        analysis.suggestedImprovements.push('Reduce file size for faster processing');
      }
      
      // Auto-detect content region
      const contentRegion = await this.detectContentRegion(imageBuffer);
      recommendations.cropRegion = contentRegion;
      
      console.log('🔍 ✅ Image analysis completed');
      
      return { recommendations, analysis };
      
    } catch (error) {
      console.error('🔍 ❌ Image analysis failed:', error);
      throw error;
    }
  }
}
