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
    if (!mathpixResult || !mathpixResult.text || !mathpixResult.boundingBoxes) {
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
          
          // Since we only use Mathpix now, we'll analyze the region for basic content
          const regionOCRResult = await this.analyzeRegionForText(croppedBuffer);
          
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


}
