interface MathpixOCRResult {
  text: string;
  confidence: number;
  boundingBoxes: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    confidence: number;
  }>;
}

  class MathpixService {
    private static readonly API_URL = 'https://api.mathpix.com/v3/text';
    private static readonly API_KEY = process.env.MATHPIX_API_KEY;

  /**
   * Check if Mathpix API is available
   */
      static isAvailable(): boolean {
      return !!this.API_KEY;
    }

  /**
   * Perform OCR on an image using Mathpix API
   */
  static async performOCR(imageData: string): Promise<MathpixOCRResult> {
    if (!this.isAvailable()) {
      throw new Error('Mathpix API key not configured');
    }

    try {
      console.log('🔍 ===== MATHPIX OCR STARTING =====');
      console.log('🔍 Image data length:', imageData.length);
      console.log('🔍 Image format:', imageData.substring(0, 30) + '...');
      
      // Use the image data exactly as received - no preprocessing, no conversion
      // Mathpix handles all image formats natively
      const requestBody = {
        src: imageData, // Send the original data URL directly
        formats: ["text", "data"],  // Request both text and data for bounding boxes
        "include_word_data": true
      };

      console.log('🔍 Sending request to Mathpix API...');
      
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'app_key': this.API_KEY || ''
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Mathpix API error: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('🔍 Mathpix API response received');
      console.log('🔍 Raw Mathpix response:', JSON.stringify(result, null, 2));
      
      // Extract text and confidence
      console.log('🔍 DEBUG: result.text exists:', !!result.text);
      console.log('🔍 DEBUG: result.text length:', result.text ? result.text.length : 'undefined');
      console.log('🔍 DEBUG: result.text preview:', result.text ? result.text.substring(0, 100) + '...' : 'undefined');
      
      const text = result.text || '';
      console.log('🔍 DEBUG: extracted text length:', text.length);
      console.log('🔍 DEBUG: extracted text preview:', text.substring(0, 100) + '...');
      
      const confidence = this.calculateOverallConfidence(result);
      
      // Extract bounding boxes from line data
      const boundingBoxes = this.extractBoundingBoxes(result);
      
      console.log('🔍 ===== MATHPIX OCR COMPLETED =====');
      console.log(`🔍 Text length: ${text.length} characters`);
      console.log(`🔍 Text preview: "${text.substring(0, 100)}..."`);
      console.log(`🔍 Confidence: ${(confidence * 100).toFixed(2)}%`);
      console.log(`🔍 Bounding boxes: ${boundingBoxes.length}`);
      
      return {
        text,
        confidence,
        boundingBoxes
      };

    } catch (error) {
      console.error('🔍 Mathpix OCR failed:', error);
      throw new Error(`Mathpix OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate overall confidence from Mathpix response
   */
  private static calculateOverallConfidence(result: any): number {
    try {
      // If we have confidence scores from individual elements, calculate average
      if (result.data && Array.isArray(result.data)) {
        const confidences = result.data
          .filter((item: any) => item.confidence !== undefined)
          .map((item: any) => item.confidence);
        
        if (confidences.length > 0) {
          const avgConfidence = confidences.reduce((sum: number, conf: number) => sum + conf, 0) / confidences.length;
          return Math.min(avgConfidence, 1.0); // Ensure it's between 0 and 1
        }
      }
      
      // Fallback confidence based on response quality
      if (result.text && result.text.length > 0) {
        return 0.8; // Good confidence if we got text
      } else if (result.data && result.data.length > 0) {
        return 0.6; // Medium confidence if we got data but no text
      } else {
        return 0.3; // Low confidence if response is minimal
      }
    } catch (error) {
      return 0.5; // Default confidence on error
    }
  }

  /**
   * Extract bounding boxes from Mathpix response data with coordinate scaling
   */
  private static extractBoundingBoxes(result: any): Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    confidence: number;
  }> {
    try {
      const boundingBoxes: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        text: string;
        confidence: number;
      }> = [];
      console.log("RAW Mathpix Response word_data")
      console.log(result.word_data)
      // Mathpix API now returns coordinates in the correct scale
      // No manual scaling needed

      // Extract from the new Mathpix format: word_data array with cnt coordinates
      if (result.word_data && Array.isArray(result.word_data)) {
        result.word_data.forEach((item: any) => {
          if (item.cnt && Array.isArray(item.cnt) && item.cnt.length > 0 && item.text) {
            // Mathpix format: cnt = [[x,y]] - contour points for the word
            const points = item.cnt as number[][];
            const rawX = Math.min(...points.map((p: number[]) => p[0]));
            const rawY = Math.min(...points.map((p: number[]) => p[1]));
            const rawWidth = Math.max(...points.map((p: number[]) => p[0])) - rawX;
            const rawHeight = Math.max(...points.map((p: number[]) => p[1])) - rawY;
            console.log("Getting cnt for each item")
            // Use coordinates directly from Mathpix API (already in correct scale)
            const x = Math.round(rawX);
            const y = Math.round(rawY);
            const width = Math.round(rawWidth);
            const height = Math.round(rawHeight);
            
            console.log('🔍 Bounding box coordinates:', {
              raw: { x: rawX, y: rawY, width: rawWidth, height: rawHeight },
              final: { x, y, width, height },
              text: item.text.substring(0, 30) + '...'
            });
            
            boundingBoxes.push({
              x,
              y,
              width,
              height,
              text: item.text,
              confidence: item.confidence || 0.8
            });
          }
        });
      }

      // If no bounding boxes found, create fallback ones based on text content
      if (boundingBoxes.length === 0 && result.text) {
        const lines = result.text.split('\n').filter((line: string) => line.trim().length > 0);
        lines.forEach((line: string, index: number) => {
          boundingBoxes.push({
            x: 50,
            y: 50 + (index * 30),
            width: Math.max(line.length * 10, 100),
            height: 25,
            text: line,
            confidence: 0.7
          });
        });
      }

      return boundingBoxes;

    } catch (error) {
      console.warn('🔍 Failed to extract bounding boxes from Mathpix response:', error);
      return [];
    }
  }

  /**
   * Test Mathpix API connectivity
   */
  static async testConnection(): Promise<{ available: boolean; error?: string }> {
    try {
      if (!this.isAvailable()) {
        return { available: false, error: 'Mathpix API key not configured' };
      }

      // Create a simple test image (1x1 white pixel)
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

      const testImageData = `data:image/png;base64,${testImage.toString('base64')}`;
      
      // Try to perform OCR on the test image
      await this.performOCR(testImageData);
      
      return { available: true };

    } catch (error) {
      return { 
        available: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

module.exports = { MathpixService };
