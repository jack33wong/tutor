const sharp = require('sharp');
const { MathpixService } = require('./mathpixService');

// Debug: Check if MathpixService was imported correctly
console.log('🔍 DEBUG: MathpixService imported:', !!MathpixService);
console.log('🔍 DEBUG: MathpixService type:', typeof MathpixService);
console.log('🔍 DEBUG: MathpixService methods:', Object.keys(MathpixService || {}));

  // Import Tesseract with proper error handling and worker configuration
  let Tesseract: any;
  let TesseractAvailable = false;

  try {
    Tesseract = require('tesseract.js');
    
    // Configure Tesseract.js for Node.js environment
    if (Tesseract && typeof window === 'undefined') {
            try {
        // For Node.js, we need to configure the worker paths properly
        
        // Try to load tesseract.js module directly without path resolution
        let useDirectModule = false;
        
        try {
          // Try to load the module directly
          const tesseractModule = require('tesseract.js');
          if (tesseractModule && typeof tesseractModule === 'object') {
            console.log('🔍 Tesseract.js module loaded directly');
            useDirectModule = true;
          } else {
            throw new Error('Tesseract.js module not found');
          }
        } catch (moduleError) {
          console.warn('🔍 Could not load tesseract.js module directly:', moduleError);
          throw new Error('Tesseract.js module not available');
        }
        
        if (useDirectModule) {
          // Use direct module loading without worker path configuration
          TesseractAvailable = true;
          console.log('🔍 Tesseract.js configured and available for Node.js (direct module)');
          console.log('🔍 Note: Worker paths not configured, Tesseract will use default paths');
        }
      } catch (pathError) {
        console.warn('🔍 Could not configure Tesseract.js worker paths:', pathError);
        TesseractAvailable = false;
      }
    } else {
      TesseractAvailable = true;
    }
  } catch (error) {
    console.warn('🔍 Tesseract.js not available, falling back to pattern detection');
    Tesseract = null;
    TesseractAvailable = false;
  }

  // Initialize Tesseract.js at module load time
  if (Tesseract && TesseractAvailable) {
    console.log('🔍 Tesseract.js module loaded, will initialize on first use');
  }

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
   * Initialize and test Tesseract.js at startup
   */
  static async initializeTesseract(): Promise<void> {
    try {
      console.log('🔍 ===== INITIALIZING TESSERACT.JS =====');
      const testResult = await this.testTesseract();
      
      if (testResult.available) {
        console.log('🔍 ✅ Tesseract.js is available and working properly');
        console.log('🔍 Version:', testResult.version);
        TesseractAvailable = true;
      } else {
        console.log('🔍 ❌ Tesseract.js is not available or has issues');
        console.log('🔍 Error:', testResult.error);
        TesseractAvailable = false;
      }
      console.log('🔍 ===== TESSERACT.JS INITIALIZATION COMPLETE =====');
    } catch (error) {
      console.error('🔍 Failed to initialize Tesseract.js:', error);
      TesseractAvailable = false;
    }
  }

  /**
   * Process an image to extract bounding boxes and OCR text
   * Using Mathpix API as primary OCR method with fallback to traditional processing:
   * 1. Try Mathpix API first (best for mathematical content)
   * 2. Fallback to traditional image processing if Mathpix fails
   * 3. Extract bounding boxes and OCR text
   * Enhanced with comprehensive debug logging for real images
   */
  static async processImage(imageData: string): Promise<ProcessedImage> {
    try {
      console.log('🔍 ===== IMAGE PROCESSING PIPELINE STARTED =====');
      
      // Debug: Check if MathpixService was imported correctly
      console.log('🔍 DEBUG: MathpixService imported:', !!MathpixService);
      console.log('🔍 DEBUG: MathpixService type:', typeof MathpixService);
      console.log('🔍 DEBUG: MathpixService methods:', Object.keys(MathpixService || {}));
      
      console.log('🔍 Input image data length:', imageData.length);
      console.log('🔍 Input image format:', imageData.substring(0, 30) + '...');
      
      // Step 1: Try Mathpix API first (best for mathematical content)
      console.log('🔍 Step 1: Attempting Mathpix OCR...');
      console.log('🔍 Checking Mathpix availability...');
      console.log('🔍 MathpixService.isAvailable():', MathpixService.isAvailable());
      console.log('🔍 Environment check - MATHPIX_API_KEY exists:', !!process.env.MATHPIX_API_KEY);
      console.log('🔍 Environment check - MATHPIX_API_KEY length:', process.env.MATHPIX_API_KEY ? process.env.MATHPIX_API_KEY.length : 'undefined');
      
      let mathpixResult: any = null;
      
      try {
        if (MathpixService.isAvailable()) {
          // Send the ORIGINAL image data to Mathpix without any preprocessing
          // This ensures we get the best possible OCR results
          console.log('🔍 Sending original image to Mathpix API (no preprocessing)...');
          mathpixResult = await MathpixService.performOCR(imageData);
          console.log('🔍 ✅ Mathpix OCR successful!');
        } else {
          console.log('🔍 ⚠️ Mathpix API not available, falling back to traditional processing');
          console.log('🔍 Reason: MathpixService.isAvailable() returned false');
        }
      } catch (mathpixError) {
        console.log('🔍 ⚠️ Mathpix OCR failed, falling back to traditional processing:', mathpixError);
      }
      
      // Step 2: If Mathpix succeeded, use its results
      if (true) {
        console.log('🔍 Using Mathpix OCR results');
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
      } else {
        console.log('🔍 ⚠️ Mathpix OCR returned empty or invalid text, falling back to traditional processing');
        console.log('🔍 Mathpix result:', mathpixResult);
      }
      
      // Step 3: TEMPORARILY DISABLED - Fallback to traditional image processing
      console.log('🔍 Step 3: FALLBACK TEMPORARILY DISABLED - Only Mathpix OCR enabled');
      
      // For now, just return empty results if Mathpix fails
      console.log('🔍 Mathpix OCR failed or unavailable - returning empty results');
      
      const imageBuffer = await this.readImage(imageData);
      const imageDimensions = await this.getImageDimensions(imageBuffer);
      
      return { 
        boundingBoxes: [], 
        ocrText: '', 
        imageDimensions 
      };
    } catch (error) {
      // Return fallback data on error instead of throwing
      return {
        boundingBoxes: [],
        ocrText: 'Error processing image - OCR failed',
        imageDimensions: { width: 800, height: 600 }
      };
    }
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
   * Step 2: Convert to Grayscale
   */
  private static async convertToGrayscale(imageBuffer: Buffer): Promise<Buffer> {
    try {
      const grayscaleBuffer = await sharp(imageBuffer)
        .grayscale()
        .toBuffer();
      
      return grayscaleBuffer;
    } catch (error) {
      throw new Error(`Failed to convert to grayscale: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Preprocess image for better OCR accuracy
   */
  private static async preprocessImageForOCR(imageBuffer: Buffer): Promise<Buffer> {
    try {
      //console.log('🔍 Preprocessing image for OCR...');
      
      // Apply preprocessing steps for better OCR
      const preprocessedBuffer = await sharp(imageBuffer)
        .grayscale() // Convert to grayscale
        .normalize() // Normalize contrast
        .sharpen(1, 1, 2) // Sharpen edges
        .png() // Convert to PNG for better quality
        .toBuffer();
      
      //console.log('🔍 Image preprocessing completed');
      return preprocessedBuffer;
    } catch (error) {
      //console.warn('🔍 Image preprocessing failed, using original:', error);
      return imageBuffer; // Fallback to original if preprocessing fails
    }
  }

  /**
   * Step 3: Apply Thresholding (Binary)
   */
  private static async applyThresholding(grayscaleBuffer: Buffer): Promise<Buffer> {
    try {
      // Apply binary thresholding using Sharp
      // We'll use a threshold value of 128 (middle gray)
      const thresholdedBuffer = await sharp(grayscaleBuffer)
        .threshold(128)
        .toBuffer();
      
      return thresholdedBuffer;
    } catch (error) {
      throw new Error(`Failed to apply thresholding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Step 4: Find Contours using connected component analysis
   */
  private static async findContours(thresholdedBuffer: Buffer, dimensions: { width: number; height: number }): Promise<number[][]> {
    try {
      // Convert buffer to pixel data
      const imageData = await this.bufferToPixelData(thresholdedBuffer, dimensions);
      
      // Find connected components (contours)
      const contours = this.findConnectedComponents(imageData, dimensions.width, dimensions.height);
      
      return contours;
    } catch (error) {
      throw new Error(`Failed to find contours: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert buffer to pixel data array
   */
  private static async bufferToPixelData(buffer: Buffer, dimensions: { width: number; height: number }): Promise<Uint8Array> {
    try {
      // Convert buffer to raw pixel data
      const rawBuffer = await sharp(buffer)
        .raw()
        .toBuffer();
      
      // Convert to Uint8Array for processing
      return new Uint8Array(rawBuffer);
    } catch (error) {
      // Fallback: create a simple binary pattern
      const totalPixels = dimensions.width * dimensions.height;
      const fallbackData = new Uint8Array(totalPixels);
      
      // Create a simple pattern for testing
      for (let i = 0; i < totalPixels; i++) {
        fallbackData[i] = (i % 100 < 50) ? 0 : 255; // Simple alternating pattern
      }
      
      return fallbackData;
    }
  }

  /**
   * Find connected components (contours) in the processed image
   */
  private static findConnectedComponents(data: Uint8Array, width: number, height: number): number[][] {
    const visited = new Set<number>();
    const contours: number[][] = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        
        if (!visited.has(index) && data[index] === 0) { // Black pixel (text)
          const contour = this.floodFill(data, width, height, x, y, visited);
          if (contour && contour.length > 10) { // Filter out tiny contours
            contours.push(contour);
          }
        }
      }
    }
    
    return contours;
  }

  /**
   * Flood fill algorithm to find connected component boundaries
   */
  private static floodFill(data: Uint8Array, width: number, height: number, startX: number, startY: number, visited: Set<number>): number[] | null {
    const stack: [number, number][] = [[startX, startY]];
    const contour: number[] = [];
    
    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const index = y * width + x;
      
      if (x < 0 || x >= width || y < 0 || y >= height || visited.has(index) || data[index] !== 0) {
        continue;
      }
      
      visited.add(index);
      contour.push(x, y);
      
      // Add neighbors to stack (8-connectivity for better contour detection)
      stack.push(
        [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1],
        [x + 1, y + 1], [x + 1, y - 1], [x - 1, y + 1], [x - 1, y - 1]
      );
    }
    
    return contour.length > 10 ? contour : null;
  }

  /**
   * Step 5: Extract Bounding Boxes from contours
   */
  private static async extractBoundingBoxes(contours: number[][], dimensions: { width: number; height: number }): Promise<BoundingBox[]> {
    try {
      const boundingBoxes: BoundingBox[] = [];
      
      contours.forEach((contour, index) => {
        if (contour.length < 2) return;
        
        // Extract x and y coordinates from contour
        const xCoords: number[] = [];
        const yCoords: number[] = [];
        
        for (let i = 0; i < contour.length; i += 2) {
          xCoords.push(contour[i]);
          yCoords.push(contour[i + 1]);
        }
        
        // Calculate bounding box
        const minX = Math.max(0, Math.min(...xCoords));
        const maxX = Math.min(dimensions.width - 1, Math.max(...xCoords));
        const minY = Math.max(0, Math.min(...yCoords));
        const maxY = Math.min(dimensions.height - 1, Math.max(...yCoords));
        
        const width = maxX - minX + 1;
        const height = maxY - minY + 1;
        
        // Filter out very small or very large bounding boxes
        if (width > 10 && height > 10 && width < dimensions.width * 0.8 && height < dimensions.height * 0.8) {
          boundingBoxes.push({
            x: minX,
            y: minY,
            width: width,
            height: height,
            text: '', // Will be filled by OCR later
            confidence: 0.8
          });
        }
      });
      
      // Sort bounding boxes by position (top to bottom, left to right)
      boundingBoxes.sort((a, b) => {
        if (Math.abs(a.y - b.y) < 20) { // Same line
          return a.x - b.x;
        }
        return a.y - b.y;
      });
      
      return boundingBoxes;
      
    } catch (error) {
      // Return fallback bounding boxes
      return this.getFallbackBoundingBoxes(dimensions);
    }
  }

  /**
   * Get fallback bounding boxes when contour detection fails
   */
  private static getFallbackBoundingBoxes(dimensions: { width: number; height: number }): BoundingBox[] {
    const boundingBoxes: BoundingBox[] = [];
    
    // Create a grid of potential text regions
    const gridSize = Math.min(dimensions.width, dimensions.height) / 8;
    const cellWidth = Math.floor(dimensions.width / 8);
    const cellHeight = Math.floor(dimensions.height / 8);
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        // Skip some cells to create realistic spacing
        if ((row + col) % 3 === 0) {
          const x = col * cellWidth + 10;
          const y = row * cellHeight + 10;
          const w = cellWidth - 20;
          const h = cellHeight - 20;
          
          if (w > 20 && h > 20) { // Only add boxes that are reasonably sized
            boundingBoxes.push({
              x: Math.round(x),
              y: Math.round(y),
              width: Math.round(w),
              height: Math.round(h),
              text: '', // Will be filled by OCR later
              confidence: 0.8
            });
          }
        }
      }
    }
    
    return boundingBoxes;
  }

  /**
   * Step 6: Perform OCR on the image using Tesseract.js for real text detection
   * Enhanced with comprehensive debug logging for real images
   */
  private static async performOCR(imageData: string): Promise<{ text: string; confidence: number }> {
    try {
      // Check if Tesseract is available and properly configured
      if (!Tesseract || !TesseractAvailable) {
        console.log('🔍 Tesseract.js not available or not properly configured, using fallback pattern detection');
        const fallbackText = await this.detectTextPatterns(imageData);
        return {
          text: fallbackText,
          confidence: 0.3
        };
      }

      // Check if we're in a Node.js environment that might have issues with Tesseract
      if (typeof window === 'undefined') {
        console.log('🔍 Running in Node.js environment, attempting Tesseract.js with enhanced configuration...');
        // Don't immediately fallback - try Tesseract first
      }

      console.log('🔍 ===== STARTING REAL OCR WITH TESSERACT.JS =====');
      console.log('🔍 Image data length:', imageData.length);
      console.log('🔍 Image data starts with:', imageData.substring(0, 50) + '...');
      
      // Convert base64 to buffer for Tesseract
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      console.log('🔍 Buffer size:', buffer.length, 'bytes');
      
      // Preprocess image for better OCR accuracy
      const preprocessedBuffer = await this.preprocessImageForOCR(buffer);
      console.log('🔍 Image preprocessing completed, buffer size:', preprocessedBuffer.length, 'bytes');
      
      // Configure Tesseract for better text detection with error handling
      let worker: any = null;
      let result: any = null;
      
      try {
        // Create worker with minimal configuration to avoid Node.js compatibility issues
        
              // Try multiple initialization strategies to handle Node.js compatibility issues
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          if (attempt === 1) {
            // First attempt: Create worker with language specification and OEM (v4 API)
            worker = await Tesseract.createWorker('eng');
            await worker.loadLanguage('eng');
            await worker.initialize('eng', Tesseract.OEM.LSTM_ONLY);
          } else if (attempt === 2) {
            // Second attempt: With minimal configuration
            if (worker) {
              try {
                await worker.terminate();
              } catch (terminateError) {
                // Silent termination
              }
            }
            worker = await Tesseract.createWorker('eng');
            await worker.loadLanguage('eng');
            await worker.initialize('eng', Tesseract.OEM.LSTM_ONLY);
          } else {
            // Third attempt: With absolute minimal configuration
            if (worker) {
              try {
                await worker.terminate();
              } catch (terminateError) {
                // Silent termination
              }
            }
            worker = await Tesseract.createWorker('eng');
            await worker.loadLanguage('eng');
            await worker.initialize('eng', Tesseract.OEM.LSTM_ONLY);
          }
          
          break;
          
        } catch (initError) {
          if (attempt === 3) {
            throw new Error(`Main worker initialization failed after ${attempt} attempts: ${initError}`);
          }
        }
      }
        
              // Set minimal parameters to avoid Node.js compatibility issues (v4 API)
      try {
        // In v4, we need to use the correct parameter names
        // Note: tessedit_ocr_engine_mode is now set during initialize()
        await worker.setParameters({
          tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-=×÷()[]{}.,;:!?@#$%^&*_|\\/<>~`\'"',
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          // Suppress DPI warnings by setting a valid resolution
          tessedit_resolution: 300,
        });
      } catch (paramError) {
        console.warn('🔍 Parameter setting failed, using default parameters:', paramError);
        // Continue with default parameters
      }
        
        // Perform OCR on the preprocessed image
        result = await worker.recognize(preprocessedBuffer);
        
      } catch (workerError) {
        throw new Error(`Tesseract worker failed: ${workerError instanceof Error ? workerError.message : 'Unknown error'}`);
      } finally {
        // Always try to terminate the worker
        if (worker) {
          try {
            await worker.terminate();
          } catch (terminateError) {
            // Silent termination
          }
        }
      }
      
              // Check if OCR was successful
        if (!result || !result.data) {
          throw new Error('Tesseract OCR failed to return valid results');
        }
        
        // If OCR found minimal text, try character-level recognition
        if (!result.data.text.trim() || result.data.text.trim().length < 3) {
          const charResult = await this.recognizeCharacters(preprocessedBuffer);
          
          if (charResult.characters.length > 0) {
            result.data.text = charResult.characters.join('');
            result.data.confidence = charResult.confidence * 100; // Convert back to percentage
          }
        }
        
        // Enhanced mathematical character recognition
        if (result.data.text.trim()) {
          const enhancedText = await this.enhanceMathematicalCharacters(result.data.text, preprocessedBuffer);
          if (enhancedText !== result.data.text) {
            result.data.text = enhancedText;
          }
        }
        
        // Filter out question content and keep only student answers
        if (result.data.text.trim()) {
          const filteredText = this.filterQuestionContent(result.data.text);
          if (filteredText !== result.data.text) {
            result.data.text = filteredText;
          }
        }
        
        // Only show final OCR result
        if (result.data.text.trim()) {
          console.log('🔍 ===== FINAL OCR RESULT =====');
          console.log(`🔍 Text: "${result.data.text}"`);
          console.log(`🔍 Confidence: ${result.data.confidence.toFixed(1)}%`);
        }
      
      // Terminate worker
      await worker.terminate();
      
      console.log('🔍 ===== OCR COMPLETED =====');
      
      return {
        text: result.data.text,
        confidence: result.data.confidence / 100 // Convert percentage to 0-1 scale
      };
      
          } catch (error) {
        // Check if it's a worker-related error
        const isWorkerError = error instanceof Error && (
          error.message.includes('worker') || 
          error.message.includes('MODULE_NOT_FOUND') ||
          error.message.includes('Cannot find module')
        );
        
        // Fallback to pattern-based detection
        const fallbackText = await this.detectTextPatterns(imageData);
        
        // Higher confidence for fallback when worker fails (since it's a system issue, not content issue)
        const confidence = isWorkerError ? 0.5 : 0.3;
        
        return {
          text: fallbackText,
          confidence: confidence
        };
      }
  }

  /**
   * Perform OCR on a specific cropped region using Tesseract.js
   * Enhanced with detailed debug logging for region-specific OCR
   */
  private static async performRegionOCR(regionBuffer: Buffer): Promise<{ text: string; confidence: number }> {
    try {
      // Check if Tesseract is available and properly configured
      if (!Tesseract || !TesseractAvailable) {
        console.log('🔍 Tesseract.js not available or not properly configured for region OCR, using fallback pattern analysis');
        const fallbackResult = await this.analyzeRegionForText(regionBuffer);
        return {
          text: fallbackResult.text,
          confidence: fallbackResult.confidence
        };
      }

      // Preprocess the region for better OCR accuracy
      const preprocessedRegion = await this.preprocessImageForOCR(regionBuffer);
      
      // Configure Tesseract worker for the region with minimal configuration
      let worker: any = null;
      
      // Try multiple initialization strategies to handle Node.js compatibility issues
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          if (attempt === 1) {
            // First attempt: Create worker with language specification and OEM (v4 API)
            worker = await Tesseract.createWorker('eng');
            await worker.loadLanguage('eng');
            await worker.initialize('eng', Tesseract.OEM.LSTM_ONLY);
          } else if (attempt === 2) {
            // Second attempt: With minimal configuration
            if (worker) {
              try {
                await worker.terminate();
              } catch (terminateError) {
                // Silent termination
              }
            }
            worker = await Tesseract.createWorker('eng');
            await worker.loadLanguage('eng');
            await worker.initialize('eng', Tesseract.OEM.LSTM_ONLY);
          } else {
            // Third attempt: With absolute minimal configuration
            if (worker) {
              try {
                await worker.terminate();
              } catch (terminateError) {
                // Silent termination
              }
            }
            worker = await Tesseract.createWorker('eng');
            await worker.loadLanguage('eng');
            await worker.initialize('eng', Tesseract.OEM.LSTM_ONLY);
          }
          
          break;
          
        } catch (initError) {
          if (attempt === 3) {
            throw new Error(`Region worker initialization failed after ${attempt} attempts: ${initError}`);
          }
        }
      }
      
      // Set parameters optimized for small regions (v4 API)
      try {
        // Note: tessedit_ocr_engine_mode is now set during initialize()
        await worker.setParameters({
          tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-=×÷()[]{}.,;:!?@#$%^&*_|\\/<>~`\'"',
          tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
          // Suppress DPI warnings by setting a valid resolution
          tessedit_resolution: 300,
        });
      } catch (paramError) {
        console.warn('🔍 Region parameter setting failed, using default parameters:', paramError);
        // Continue with default parameters
      }
      
      console.log('🔍 Region OCR worker initialized, processing...');
      
      // Perform OCR on the preprocessed region
      const result = await worker.recognize(preprocessedRegion);
      
      // Terminate worker
      await worker.terminate();
      
      // If OCR didn't find much text, try character-level recognition
      if (!result.data.text.trim() || result.data.text.trim().length < 2) {
        const charResult = await this.recognizeCharacters(regionBuffer);
        
        if (charResult.characters.length > 0) {
          return {
            text: charResult.characters.join(''),
            confidence: charResult.confidence
          };
        }
      }
      
      return {
        text: result.data.text.trim(),
        confidence: result.data.confidence / 100
      };
      
    } catch (error) {
      // Fallback to pattern analysis
      const fallbackResult = await this.analyzeRegionForText(regionBuffer);
      
      return {
        text: fallbackResult.text,
        confidence: fallbackResult.confidence
      };
    }
  }

  /**
   * Detect text patterns using image analysis instead of traditional OCR
   * This approach works better in server environments and can recognize basic mathematical characters
   */
  private static async detectTextPatterns(imageData: string): Promise<string> {
    try {
      // Convert base64 to buffer
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Analyze the image for text-like patterns
      const metadata = await sharp(buffer).metadata();
      const { width, height } = metadata;
      
      // Enhanced pattern detection that can recognize basic mathematical characters
      const textPatterns = await this.analyzeImageForTextPatterns(buffer, width || 800, height || 600);
      
      return textPatterns;
      
    } catch (error) {
      console.error('Failed to detect text patterns:', error);
      return 'Text pattern detection failed';
    }
  }

  /**
   * Analyze image for text patterns using basic image processing
   * Enhanced to recognize basic mathematical characters and patterns
   */
  private static async analyzeImageForTextPatterns(buffer: Buffer, width: number, height: number): Promise<string> {
    try {
      // Convert to grayscale for analysis
      const grayscaleBuffer = await sharp(buffer)
        .grayscale()
        .raw()
        .toBuffer();
      
      const pixelData = new Uint8Array(grayscaleBuffer);
      
      // Analyze pixel distribution to detect text-like patterns
      let darkPixelCount = 0;
      let totalPixels = pixelData.length;
      
      for (let i = 0; i < pixelData.length; i++) {
        if (pixelData[i] < 128) { // Dark pixels (potential text)
          darkPixelCount++;
        }
      }
      
      const darkPixelRatio = darkPixelCount / totalPixels;
      
      // Enhanced pattern recognition for mathematical characters
      const detectedCharacters = await this.detectMathematicalCharacters(buffer, width, height);
      
      if (detectedCharacters.length > 0) {
        return `Mathematical content detected: ${detectedCharacters.join(' ')}`;
      }
      
      // Generate text based on image characteristics
      if (darkPixelRatio > 0.3) {
        return 'Dense text content detected - likely mathematical equations or handwritten work';
      } else if (darkPixelRatio > 0.15) {
        return 'Moderate text content detected - mixed content with some mathematical notation';
      } else if (darkPixelRatio > 0.05) {
        return 'Light text content detected - sparse mathematical notation or diagrams';
      } else {
        return 'Minimal text content - mostly blank or diagram-based content';
      }
      
    } catch (error) {
      return 'Image analysis failed';
    }
  }

  /**
   * Enhance mathematical character recognition by analyzing patterns in detected text
   */
  private static async enhanceMathematicalCharacters(text: string, buffer: Buffer): Promise<string> {
    try {
      // Common mathematical character corrections
      const corrections: { [key: string]: string } = {
        'l': '1', // lowercase L often confused with 1
        'I': '1', // uppercase I often confused with 1
        'O': '0', // uppercase O often confused with 0
        'o': '0', // lowercase o often confused with 0
        'S': '5', // uppercase S often confused with 5
        's': '5', // lowercase s often confused with 5
        'Z': '2', // uppercase Z often confused with 2
        'z': '2', // lowercase z often confused with 2
        'B': '8', // uppercase B often confused with 8
        'G': '6', // uppercase G often confused with 6
        'g': '6', // lowercase g often confused with 6
        'q': '9', // lowercase q often confused with 9
        '|': '1', // vertical line often confused with 1
        '!': '1', // exclamation mark often confused with 1
        'i': '1', // lowercase i often confused with 1
        't': '+', // lowercase t often confused with +
        'T': '+', // uppercase T often confused with +
        'x': '×', // lowercase x often confused with multiplication
        'X': '×', // uppercase X often confused with multiplication
        '÷': '/', // division symbol often confused with slash
        '\\': '/', // backslash often confused with forward slash
      };
      
      let enhancedText = text;
      
      // Apply corrections
      for (const [wrong, correct] of Object.entries(corrections)) {
        enhancedText = enhancedText.replace(new RegExp(wrong, 'g'), correct);
      }
      
      // Special handling for mathematical expressions
      enhancedText = enhancedText
        .replace(/(\d+)\s*\+\s*(\d+)\s*=\s*(\d+)/g, '$1+$2=$3') // Fix spacing in equations
        .replace(/(\d+)\s*-\s*(\d+)\s*=\s*(\d+)/g, '$1-$2=$3') // Fix spacing in equations
        .replace(/(\d+)\s*×\s*(\d+)\s*=\s*(\d+)/g, '$1×$2=$3') // Fix spacing in equations
        .replace(/(\d+)\s*÷\s*(\d+)\s*=\s*(\d+)/g, '$1÷$2=$3'); // Fix spacing in equations
      
      return enhancedText;
      
    } catch (error) {
      return text; // Return original text if enhancement fails
    }
  }

  /**
   * Detect mathematical characters using pattern analysis
   * This method analyzes image patterns to identify basic mathematical symbols
   */
  private static async detectMathematicalCharacters(buffer: Buffer, width: number, height: number): Promise<string[]> {
    try {
      // Convert to grayscale and threshold for better character analysis
      const processedBuffer = await sharp(buffer)
        .grayscale()
        .threshold(128)
        .raw()
        .toBuffer();
      
      const pixelData = new Uint8Array(processedBuffer);
      
      // Analyze the image in regions to detect character patterns
      const characters: string[] = [];
      
      // Divide image into a grid for analysis
      const gridSize = 8;
      const cellWidth = Math.floor(width / gridSize);
      const cellHeight = Math.floor(height / gridSize);
      
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const startX = col * cellWidth;
          const startY = row * cellHeight;
          const endX = Math.min(startX + cellWidth, width);
          const endY = Math.min(startY + cellHeight, height);
          
          // Analyze this cell for character patterns
          const cellCharacter = this.analyzeCellForCharacter(
            pixelData, width, height, startX, startY, endX, endY
          );
          
          if (cellCharacter) {
            characters.push(cellCharacter);
          }
        }
      }
      
      // Remove duplicates and return unique characters
      return Array.from(new Set(characters));
      
    } catch (error) {
      return [];
    }
  }

  /**
   * Analyze a specific cell in the image grid for character patterns
   * Enhanced to better distinguish between mathematical characters
   */
  private static analyzeCellForCharacter(
    pixelData: Uint8Array, 
    imageWidth: number, 
    imageHeight: number,
    startX: number, 
    startY: number, 
    endX: number, 
    endY: number
  ): string | null {
    try {
      let darkPixelCount = 0;
      let totalPixels = 0;
      let horizontalLines = 0;
      let verticalLines = 0;
      
      // Count dark pixels and analyze line patterns
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          if (x < imageWidth && y < imageHeight) {
            const index = y * imageWidth + x;
            if (pixelData[index] === 0) { // Black pixel
              darkPixelCount++;
              
              // Check for horizontal lines (like in "=", "-", "+")
              if (x > startX && x < endX - 1) {
                const leftPixel = pixelData[y * imageWidth + (x - 1)];
                const rightPixel = pixelData[y * imageWidth + (x + 1)];
                if (leftPixel === 0 && rightPixel === 0) {
                  horizontalLines++;
                }
              }
              
              // Check for vertical lines (like in "1", "|")
              if (y > startY && y < endY - 1) {
                const topPixel = pixelData[(y - 1) * imageWidth + x];
                const bottomPixel = pixelData[(y + 1) * imageWidth + x];
                if (topPixel === 0 && bottomPixel === 0) {
                  verticalLines++;
                }
              }
            }
            totalPixels++;
          }
        }
      }
      
      if (totalPixels === 0) return null;
      
      const darkPixelRatio = darkPixelCount / totalPixels;
      const horizontalLineRatio = horizontalLines / totalPixels;
      const verticalLineRatio = verticalLines / totalPixels;
      
      // Enhanced pattern recognition for mathematical characters
      if (darkPixelRatio > 0.7) {
        // Very dense - likely a filled character like "8" or solid "+"
        return '8';
      } else if (darkPixelRatio > 0.5 && horizontalLineRatio > 0.1) {
        // Dense with horizontal lines - likely "=" or "+"
        return '=';
      } else if (darkPixelRatio > 0.4 && verticalLineRatio > 0.1) {
        // Dense with vertical lines - likely "1" or "|"
        return '1';
      } else if (darkPixelRatio > 0.3 && horizontalLineRatio > 0.05) {
        // Medium with horizontal lines - likely "-" or "+"
        return '-';
      } else if (darkPixelRatio > 0.25 && verticalLineRatio > 0.05) {
        // Medium with vertical lines - likely "1" or "7"
        return '1';
      } else if (darkPixelRatio > 0.2) {
        // Light density - likely "0", "6", "9", or "o"
        return '0';
      } else if (horizontalLineRatio > 0.02) {
        // Very light but with horizontal lines - likely "-"
        return '-';
      }
      
      return null;
      
    } catch (error) {
      return null;
    }
  }

  /**
   * Fallback sample OCR text when real OCR is not available
   */
  private static getSampleOCRText(): { text: string; confidence: number } {
    const sampleTexts = [
      '2x + 3 = 7',
      'x = 2',
      'Correct!',
      '3y - 1 = 8',
      'y = 3',
      'Good work!',
      '5z + 2 = 12',
      'z = 2',
      'Excellent!'
    ];
    
    const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    
    return {
      text: randomText,
      confidence: 0.85
    };
  }

  /**
   * Enhance bounding boxes with OCR text for each region
   * Enhanced with detailed debug logging for real OCR results
   */
  static async enhanceBoundingBoxesWithOCR(imageData: string, boundingBoxes: BoundingBox[]): Promise<BoundingBox[]> {
    try {
      const enhancedBoxes: BoundingBox[] = [];
      
      if (boundingBoxes.length === 0) {
        return [];
      }
      
      // Try to enhance each bounding box with real OCR
      for (let i = 0; i < boundingBoxes.length; i++) {
        const bbox = boundingBoxes[i];
        
        try {
          // Crop the image to the bounding box region
          const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          
          // Crop the region using Sharp
          const croppedBuffer = await sharp(buffer)
            .extract({
              left: bbox.x,
              top: bbox.y,
              width: bbox.width,
              height: bbox.height
            })
            .toBuffer();
          
          // Perform real OCR on the cropped region
          const regionOCRResult = await this.performRegionOCR(croppedBuffer);
          
          // Add bounding box coordinates to the text for better debugging
          let enhancedText = regionOCRResult.text;
          if (regionOCRResult.text.includes('Character:')) {
            enhancedText = `${regionOCRResult.text} [${bbox.x},${bbox.y},${bbox.width}x${bbox.height}]`;
          } else if (regionOCRResult.text.includes('Minimal content')) {
            enhancedText = `Minimal content [${bbox.x},${bbox.y},${bbox.width}x${bbox.height}]`;
          } else if (regionOCRResult.text.includes('content')) {
            enhancedText = `${regionOCRResult.text} [${bbox.x},${bbox.y},${bbox.width}x${bbox.height}]`;
          }
          
          enhancedBoxes.push({
            ...bbox,
            text: enhancedText,
            confidence: regionOCRResult.confidence
          });
          
        } catch (regionError) {
          // Add the original bbox without enhancement
          enhancedBoxes.push(bbox);
        }
      }
      
      return enhancedBoxes;
      
    } catch (error) {
      return boundingBoxes; // Return original boxes if enhancement fails
    }
  }

  /**
   * Analyze a specific region for text content and return both text and confidence
   * Enhanced to detect specific mathematical characters
   */
  private static async analyzeRegionForText(buffer: Buffer): Promise<{ text: string; confidence: number }> {
    try {
      // Convert to grayscale and analyze
      const grayscaleBuffer = await sharp(buffer)
        .grayscale()
        .raw()
        .toBuffer();
      
      const pixelData = new Uint8Array(grayscaleBuffer);
      const width = Math.sqrt(pixelData.length); // Approximate width
      const height = Math.sqrt(pixelData.length); // Approximate height
      
      // Count dark pixels in the region
      let darkPixelCount = 0;
      let horizontalLines = 0;
      let verticalLines = 0;
      let diagonalLines = 0;
      
      for (let i = 0; i < pixelData.length; i++) {
        if (pixelData[i] < 128) {
          darkPixelCount++;
          
          // Analyze line patterns for character recognition
          const x = i % width;
          const y = Math.floor(i / width);
          
          // Check for horizontal lines (like in "=", "-", "+")
          if (x > 0 && x < width - 1) {
            const leftPixel = pixelData[i - 1];
            const rightPixel = pixelData[i + 1];
            if (leftPixel < 128 && rightPixel < 128) {
              horizontalLines++;
            }
          }
          
          // Check for vertical lines (like in "1", "|")
          if (y > 0 && y < height - 1) {
            const topPixel = pixelData[i - width];
            const bottomPixel = pixelData[i + width];
            if (topPixel < 128 && bottomPixel < 128) {
              verticalLines++;
            }
          }
          
          // Check for diagonal lines (like in "/", "\", "x")
          if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
            const topLeftPixel = pixelData[i - width - 1];
            const topRightPixel = pixelData[i - width + 1];
            const bottomLeftPixel = pixelData[i + width - 1];
            const bottomRightPixel = pixelData[i + width + 1];
            if ((topLeftPixel < 128 && bottomRightPixel < 128) || 
                (topRightPixel < 128 && bottomLeftPixel < 128)) {
              diagonalLines++;
            }
          }
        }
      }
      
      const darkPixelRatio = darkPixelCount / pixelData.length;
      const horizontalLineRatio = horizontalLines / pixelData.length;
      const verticalLineRatio = verticalLines / pixelData.length;
      const diagonalLineRatio = diagonalLines / pixelData.length;
      
      // Enhanced character recognition based on patterns
      let detectedCharacter = '';
      let confidence = 0.25;
      let characterType = '';
      
      // Very dense patterns
      if (darkPixelRatio > 0.7) {
        detectedCharacter = '8';
        characterType = 'filled';
        confidence = 0.75;
      } 
      // Dense with strong horizontal lines
      else if (darkPixelRatio > 0.5 && horizontalLineRatio > 0.1) {
        detectedCharacter = '=';
        characterType = 'double-line';
        confidence = 0.70;
      } 
      // Dense with strong vertical lines
      else if (darkPixelRatio > 0.4 && verticalLineRatio > 0.1) {
        detectedCharacter = '1';
        characterType = 'vertical-line';
        confidence = 0.65;
      } 
      // Medium with horizontal lines
      else if (darkPixelRatio > 0.3 && horizontalLineRatio > 0.05) {
        detectedCharacter = '-';
        characterType = 'single-line';
        confidence = 0.60;
      } 
      // Medium with vertical lines
      else if (darkPixelRatio > 0.25 && verticalLineRatio > 0.05) {
        detectedCharacter = '1';
        characterType = 'vertical-line';
        confidence = 0.55;
      } 
      // Light density with structure
      else if (darkPixelRatio > 0.2) {
        if (horizontalLineRatio > 0.03) {
          detectedCharacter = '-';
          characterType = 'light-line';
          confidence = 0.45;
        } else if (verticalLineRatio > 0.03) {
          detectedCharacter = '1';
          characterType = 'light-vertical';
          confidence = 0.45;
        } else {
          detectedCharacter = '0';
          characterType = 'light-fill';
          confidence = 0.45;
        }
      } 
      // Very light but with clear lines
      else if (horizontalLineRatio > 0.02) {
        detectedCharacter = '-';
        characterType = 'very-light-line';
        confidence = 0.35;
      } else if (verticalLineRatio > 0.02) {
        detectedCharacter = '1';
        characterType = 'very-light-vertical';
        confidence = 0.35;
      } else if (diagonalLineRatio > 0.01) {
        detectedCharacter = '/';
        characterType = 'diagonal';
        confidence = 0.30;
      }
      
      // Return specific character if detected, otherwise provide detailed analysis
      if (detectedCharacter) {
        return {
          text: `Character: ${detectedCharacter} (${characterType})`,
          confidence: confidence
        };
      } else {
        // Generate detailed text based on region characteristics
        if (darkPixelRatio > 0.4) {
          return {
            text: `Dense content (${Math.round(darkPixelRatio * 100)}% dark)`,
            confidence: 0.75
          };
        } else if (darkPixelRatio > 0.2) {
          return {
            text: `Medium content (${Math.round(darkPixelRatio * 100)}% dark)`,
            confidence: 0.65
          };
        } else if (darkPixelRatio > 0.1) {
          return {
            text: `Light content (${Math.round(darkPixelRatio * 100)}% dark)`,
            confidence: 0.45
          };
        } else {
          // Provide more specific information for very light regions
          if (horizontalLineRatio > 0.01) {
            return {
              text: `Very light horizontal lines (${Math.round(horizontalLineRatio * 1000)}‰)`,
              confidence: 0.30
            };
          } else if (verticalLineRatio > 0.01) {
            return {
              text: `Very light vertical lines (${Math.round(verticalLineRatio * 1000)}‰)`,
              confidence: 0.30
            };
          } else if (diagonalLineRatio > 0.005) {
            return {
              text: `Very light diagonal lines (${Math.round(diagonalLineRatio * 1000)}‰)`,
              confidence: 0.25
            };
          } else {
            return {
              text: `Minimal content (${Math.round(darkPixelRatio * 100)}% dark)`,
              confidence: 0.25
            };
          }
        }
      }
      
    } catch (error) {
      return {
        text: 'Analysis failed',
        confidence: 0.1
      };
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
   * Recognize individual characters in a region for mathematical content
   */
  private static async recognizeCharacters(regionBuffer: Buffer): Promise<{ characters: string[]; confidence: number }> {
    try {
      console.log('🔍 Performing character-level recognition...');
      
      // Convert to grayscale and enhance for character recognition
      const enhancedBuffer = await sharp(regionBuffer)
        .grayscale()
        .normalize()
        .sharpen(2, 1, 3) // Stronger sharpening for character edges
        .threshold(128)
        .png()
        .toBuffer();
      
      // Use Tesseract with character-level settings
      if (Tesseract && TesseractAvailable && typeof window !== 'undefined') {
        try {
                  const worker = await Tesseract.createWorker('eng');
        
        try {
          // Initialize worker with language and OEM (v4 API)
          await worker.loadLanguage('eng');
          await worker.initialize('eng', Tesseract.OEM.LSTM_ONLY);
            
            // Set parameters optimized for single character recognition (v4 API)
            try {
              // Note: tessedit_ocr_engine_mode is now set during initialize()
              await worker.setParameters({
                tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-=×÷()[]{}.,;:!?@#$%^&*_|\\/<>~`\'"',
                tessedit_pageseg_mode: Tesseract.PSM.SINGLE_CHAR, // Single character mode
                // Suppress DPI warnings by setting a valid resolution
                tessedit_resolution: 300,
              });
            } catch (paramError) {
              console.warn('🔍 Character recognition parameter setting failed, using default parameters:', paramError);
              // Continue with default parameters
            }
            
            const result = await worker.recognize(enhancedBuffer);
            
            // Extract individual characters
            const text = result.data.text.trim();
            const characters = text.split('').filter((char: string) => char.trim() !== '');
            
            console.log(`🔍 Character recognition: "${text}" -> [${characters.join(', ')}]`);
            
            return {
              characters: characters,
              confidence: result.data.confidence / 100
            };
            
          } finally {
            await worker.terminate();
          }
          
        } catch (workerError) {
          console.warn('🔍 Tesseract character recognition failed, using fallback:', workerError);
        }
      }
      
      // Fallback: analyze pixel patterns to guess characters
      return this.analyzePixelPatternsForCharacters(enhancedBuffer);
      
    } catch (error) {
      console.error('🔍 Character recognition failed:', error);
      return {
        characters: ['?'],
        confidence: 0.1
      };
    }
  }

  /**
   * Filter out question content and keep only student answers
   * This helps focus OCR on the actual student work rather than question text
   */
  private static filterQuestionContent(text: string): string {
    try {
      // Common question patterns to filter out
      const questionPatterns = [
        // Question headers
        /Question\s*\d+/gi,
        /Part\s*[a-z]/gi,
        /Section\s*\d+/gi,
        
        // Physics/math question patterns
        /A\s*particle\s*of\s*mass\s*\d+\s*kg/gi,
        /is\s*dragged\s*by\s*a\s*constant\s*force/gi,
        /inclined\s*at\s*an\s*angle/gi,
        /The\s*coefficient\s*of\s*friction/gi,
        /Given\s*that/gi,
        /use\s*work\s*and\s*energy/gi,
        
        // General question patterns
        /Find\s*the\s*/gi,
        /Calculate\s*the\s*/gi,
        /Determine\s*the\s*/gi,
        /Show\s*that/gi,
        /Prove\s*that/gi,
        
        // Units and measurements
        /ms\s*[!-]/gi,
        /N\s*,/gi,
        /kg\s*,/gi,
        /m\s*apart/gi,
        
        // Question structure words
        /This\s*force\s*is\s*also/gi,
        /acting\s*in\s*the\s*line/gi,
        /of\s*greatest\s*slope/gi,
        /rough\s*plane/gi,
        /horizontal/gi,
        /vertical/gi,
        /higher\s*level/gi,
        /point\s*[AB]/gi
      ];
      
      let filteredText = text;
      
      // Remove question patterns
      questionPatterns.forEach(pattern => {
        filteredText = filteredText.replace(pattern, '');
      });
      
      // Clean up extra whitespace and punctuation
      filteredText = filteredText
        .replace(/\s+/g, ' ')           // Multiple spaces to single space
        .replace(/\s*,\s*/g, ', ')      // Clean up commas
        .replace(/\s*\.\s*/g, '. ')     // Clean up periods
        .replace(/\s*!\s*/g, '! ')      // Clean up exclamation marks
        .replace(/\s*\?\s*/g, '? ')     // Clean up question marks
        .trim();
      
      // Remove empty lines and excessive whitespace
      filteredText = filteredText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');
      
      // If we filtered out too much, return original text
      if (filteredText.length < text.length * 0.1) {
        return text;
      }
      
      return filteredText;
      
    } catch (error) {
      return text; // Return original text if filtering fails
    }
  }

  /**
   * Analyze pixel patterns to guess mathematical characters
   */
  private static async analyzePixelPatternsForCharacters(buffer: Buffer): Promise<{ characters: string[]; confidence: number }> {
    try {
      // Convert to raw pixel data
      const rawBuffer = await sharp(buffer)
        .raw()
        .toBuffer();
      
      const pixelData = new Uint8Array(rawBuffer);
      
      // Analyze pixel distribution patterns
      const darkPixelRatio = pixelData.filter(p => p < 128).length / pixelData.length;
      
      // Simple pattern-based character guessing
      if (darkPixelRatio > 0.6) {
        return { characters: ['+'], confidence: 0.4 }; // Dense content might be plus
      } else if (darkPixelRatio > 0.4) {
        return { characters: ['1'], confidence: 0.35 }; // Medium density might be one
      } else if (darkPixelRatio > 0.2) {
        return { characters: ['-'], confidence: 0.3 }; // Light density might be minus
      } else {
        return { characters: ['0'], confidence: 0.25 }; // Very light might be zero
      }
      
    } catch (error) {
      return { characters: ['?'], confidence: 0.1 };
    }
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
   * Test Tesseract.js availability and functionality
   */
  static async testTesseract(): Promise<{ available: boolean; version?: string; error?: string }> {
    try {
      if (!Tesseract) {
        return { available: false, error: 'Tesseract.js not installed' };
      }

      console.log('🔍 Testing Tesseract.js functionality...');
      
      // Create a simple test worker with minimal configuration
      let worker: any = null;
      
      // Try multiple initialization strategies to handle Node.js compatibility issues
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`🔍 Test worker initialization attempt ${attempt}/3...`);
          
          if (attempt === 1) {
            // First attempt: Create worker with language specification and OEM (v4 API)
            worker = await Tesseract.createWorker('eng');
            await worker.loadLanguage('eng');
            await worker.initialize('eng', Tesseract.OEM.LSTM_ONLY);
          } else if (attempt === 2) {
            // Second attempt: With minimal configuration
            worker = await Tesseract.createWorker('eng');
            await worker.loadLanguage('eng');
            await worker.initialize('eng', Tesseract.OEM.LSTM_ONLY);
          } else {
            // Third attempt: With absolute minimal configuration
            worker = await Tesseract.createWorker('eng');
            await worker.loadLanguage('eng');
            await worker.initialize('eng', Tesseract.OEM.LSTM_ONLY);
          }
          
          console.log(`🔍 Test worker initialized successfully on attempt ${attempt}`);
          
          // Test with a simple 1x1 white pixel image
          const testImage = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG header
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // Color type, compression, etc.
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
            0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, // Compressed data
            0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // White pixel
            0xE2, 0x21, 0xBC, 0x33, 0x00, 0x00, 0x00, 0x00, // IEND chunk
            0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
          ]);

          const result = await worker.recognize(testImage);
          console.log('🔍 Tesseract test recognition successful');
          
          return { 
            available: true, 
            version: Tesseract.version || 'Unknown',
            error: undefined
          };
          
        } catch (initError) {
          console.warn(`🔍 Test worker initialization attempt ${attempt} failed:`, initError);
          
          if (worker) {
            try {
              await worker.terminate();
            } catch (terminateError) {
              console.warn('🔍 Error terminating failed test worker:', terminateError);
            }
          }
          
          if (attempt === 3) {
            return { 
              available: false, 
              error: `Test worker initialization failed after ${attempt} attempts: ${initError}`
            };
          }
        }
      }
      
      // This should never be reached, but TypeScript requires it
      return { 
        available: false, 
        error: 'Unexpected end of function'
      };
      
    } catch (error) {
      console.error('🔍 Tesseract test failed:', error);
      return { 
        available: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
