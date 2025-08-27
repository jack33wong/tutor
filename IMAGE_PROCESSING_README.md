# Image Processing & Bounding Box Detection

This document describes the new image processing functionality that extracts bounding boxes from images and integrates with the AI marking system.

## Overview

The system now includes advanced image processing capabilities that:
1. **Detect text regions** using canvas-based image processing algorithms
2. **Extract bounding boxes** with precise coordinates for each text region
3. **Perform real OCR** using Tesseract.js to read text content with detailed logging
4. **Integrate with AI marking** to provide accurate annotation placement

## Enhanced OCR with Debug Logging

### Real OCR Implementation
The system now uses **Tesseract.js** for real text detection instead of pattern-based analysis:

- **Full-image OCR**: Processes the entire image to extract all text content
- **Region-specific OCR**: Analyzes each detected bounding box individually
- **Confidence scoring**: Provides accuracy scores for each detected text region
- **Word-level analysis**: Breaks down text into individual words with coordinates
- **Line-level analysis**: Groups text by lines for better context understanding

### Comprehensive Debug Logging
When processing real images, the system provides extensive logging in the terminal:

```
🔍 ===== IMAGE PROCESSING PIPELINE STARTED =====
🔍 Input image data length: 12345
🔍 Image format: data:image/jpeg;base64,/9j/4AAQ...
🔍 Step 1: Reading image and getting dimensions...
🔍 Image dimensions: 800x600 pixels
🔍 Image buffer size: 45678 bytes
🔍 Step 2: Converting to grayscale...
🔍 Grayscale buffer size: 45678 bytes
🔍 Step 3: Applying thresholding...
🔍 Thresholded buffer size: 45678 bytes
🔍 Step 4: Finding contours...
🔍 Found 15 contours
🔍 Step 5: Extracting bounding boxes...
🔍 Extracted 15 bounding boxes
🔍 BBox 1: [50, 80, 200, 150]
🔍 BBox 2: [50, 160, 200, 180]
🔍 Step 6: Performing full-image OCR with Tesseract.js...
🔍 ===== OCR RESULTS =====
🔍 OCR Confidence: 85.2
🔍 Detected Text Length: 45
🔍 Raw OCR Text:
🔍 ================================================================================
🔍 2x + 3 = 7
🔍 x = 2
🔍 ================================================================================
🔍 Individual Word Analysis:
🔍 Word 1: "2x" - Confidence: 92.5% - BBox: [50, 80, 70, 100]
🔍 Word 2: "+" - Confidence: 88.3% - BBox: [80, 80, 90, 100]
🔍 Word 3: "3" - Confidence: 95.1% - BBox: [100, 80, 110, 100]
🔍 Word 4: "=" - Confidence: 87.2% - BBox: [120, 80, 130, 100]
🔍 Word 5: "7" - Confidence: 93.8% - BBox: [140, 80, 150, 100]
🔍 Step 7: Enhancing bounding boxes with region-specific OCR...
🔍 ===== ENHANCING BOUNDING BOXES WITH OCR =====
🔍 Total bounding boxes to process: 15
🔍 Processing region 1/15: [50, 80, 200x150]
🔍 Cropping region 1 to 200x150 pixels
🔍 Region 1 cropped successfully, size: 12345 bytes
🔍 Performing region-specific OCR on cropped image...
🔍 Region OCR completed:
🔍   Text: "2x + 3 = 7"
🔍   Confidence: 85.2%
🔍   Words detected: 5
🔍 ===== FINAL OCR TEXT SUMMARY =====
🔍 Region 1: "2x + 3 = 7" (Confidence: 85.2%)
🔍 Region 2: "x = 2" (Confidence: 82.1%)
🔍 ===== IMAGE PROCESSING PIPELINE COMPLETED =====
🔍 Final Results:
🔍   - Total bounding boxes: 15
🔍   - Full OCR text length: 45 characters
🔍   - Full OCR confidence: 85.2%
🔍   - Image dimensions: 800x600
🔍 ===== DETECTED TEXT PREVIEW =====
🔍 2x + 3 = 7
🔍 x = 2
🔍 ===== END TEXT PREVIEW =====
```

### Debug Logging Features

1. **Pipeline Progress Tracking**: Each step of the image processing is logged with timestamps
2. **Image Analysis Details**: Buffer sizes, dimensions, and processing statistics
3. **OCR Results**: Full text content, confidence scores, and word-level analysis
4. **Bounding Box Details**: Coordinates, sizes, and region-specific OCR results
5. **Error Handling**: Comprehensive error logging with stack traces and fallback information
6. **Performance Metrics**: Processing times and memory usage information

### Testing the Enhanced OCR

To see the debug logging in action:

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to the test pages**:
   - `/mark-homework` - Upload homework images for marking
   - `/test-image-processing` - Test image processing functionality

3. **Upload a real image** containing text (math homework, documents, etc.)

4. **Watch the terminal** for comprehensive OCR processing logs

5. **Run the test script** to see example output:
   ```bash
   node scripts/test-ocr-debug.js
   ```

## Components

### 1. ImageProcessingService (`services/imageProcessingService.ts`)

The core service that handles image processing and bounding box extraction.

**Key Features:**
- **Grayscale conversion** and thresholding for text detection
- **Connected component analysis** to find text regions
- **Flood fill algorithm** for precise boundary detection
- **OCR integration** with Tesseract.js
- **Mathematical content filtering** to focus on relevant regions

**Main Methods:**
```typescript
// Process an image to extract bounding boxes and OCR text
static async processImage(imageData: string): Promise<ProcessedImage>

// Enhance bounding boxes with OCR text for each region
static async enhanceBoundingBoxesWithOCR(imageData: string, boundingBoxes: BoundingBox[]): Promise<BoundingBox[]>

// Filter bounding boxes to focus on mathematical content
static filterMathematicalContent(boundingBoxes: BoundingBox[]): BoundingBox[]
```

### 2. BoundingBoxDisplay Component (`components/BoundingBoxDisplay.tsx`)

A React component that visualizes detected bounding boxes and OCR results.

**Features:**
- **Interactive bounding box overlays** on the image
- **Region numbering** for easy identification
- **Detailed text information** with confidence scores
- **Scalable display** that adapts to different image sizes
- **Processing information** explaining the technology

### 3. Test Page (`app/test-image-processing/page.tsx`)

A dedicated testing interface for the image processing functionality.

**Capabilities:**
- **Image upload** and preview
- **Real-time processing** with progress indicators
- **Bounding box visualization** with toggle controls
- **Download processed images** with bounding box overlays
- **Technical details** and processing statistics

## How It Works

### 1. Image Preprocessing
```typescript
// Convert to grayscale and apply thresholding
const processedData = this.preprocessImageData(data, width, height);

// Binary thresholding (text = black, background = white)
const threshold = 150;
processed[i / 4] = gray < threshold ? 0 : 255;
```

### 2. Bounding Box Detection
```typescript
// Find connected components (contours)
const boundingBoxes = this.findConnectedComponents(processedData, width, height);

// Flood fill algorithm to determine boundaries
const bbox = this.floodFill(data, width, height, x, y, visited);
```

### 3. OCR Processing
```typescript
// Perform OCR on the entire image
const ocrResult = await Tesseract.recognize(imageData, 'eng');

// Enhance bounding boxes with region-specific OCR
const enhancedBoxes = await this.enhanceBoundingBoxesWithOCR(imageData, boundingBoxes);
```

### 4. AI Integration
The extracted bounding boxes and OCR text are sent to the AI model (ChatGPT/Gemini) along with the image, enabling:

- **Precise annotation placement** using exact coordinates
- **Context-aware marking** based on detected text content
- **Improved accuracy** in identifying mathematical errors
- **Better positioning** of correction marks and comments

## API Integration

### Mark Homework API (`app/api/mark-homework/route.ts`)

The API now includes bounding box information in the response:

```typescript
return NextResponse.json({ 
  markedImage,
  instructions: markingInstructions,
  ocrResults: processedImage ? processedImage.boundingBoxes.map((bbox: BoundingBox) => ({
    text: bbox.text || '',
    bbox: [bbox.x, bbox.y, bbox.x + bbox.width, bbox.y + bbox.height],
    confidence: bbox.confidence || 0
  })) : [],
  message: `Homework marked successfully using ${modelName} + Sharp image processing + OCR text detection`,
  apiUsed
});
```

### Enhanced AI Prompts

The AI now receives detailed information about detected text regions:

```
DETECTED TEXT REGIONS:
Region 1: [50, 80, 200, 150] - "2x + 3 = 7"
Region 2: [50, 160, 200, 180] - "x = 2"

IMAGE DIMENSIONS: 800 x 600

FULL OCR TEXT:
2x + 3 = 7
x = 2
```

## Usage Examples

### 1. Basic Image Processing
```typescript
import { ImageProcessingService } from '@/services/imageProcessingService';

const result = await ImageProcessingService.processImage(imageData);
console.log('Found', result.boundingBoxes.length, 'text regions');
console.log('OCR Text:', result.ocrText);
```

### 2. Mathematical Content Filtering
```typescript
const mathBoxes = ImageProcessingService.filterMathematicalContent(result.boundingBoxes);
console.log('Mathematical regions:', mathBoxes.length);
```

### 3. Enhanced OCR with Bounding Boxes
```typescript
const enhancedBoxes = await ImageProcessingService.enhanceBoundingBoxesWithOCR(
  imageData, 
  result.boundingBoxes
);
```

## Technical Details

### Performance Considerations
- **Canvas-based processing** for browser compatibility
- **Efficient algorithms** for real-time processing
- **Memory management** for large images
- **Progressive processing** with user feedback

### Browser Compatibility
- **Modern browsers** with Canvas API support
- **Tesseract.js** for cross-platform OCR
- **Responsive design** for various screen sizes

### Error Handling
- **Graceful degradation** when processing fails
- **Detailed error messages** for debugging
- **Fallback options** for unsupported features

## Future Enhancements

### Planned Features
1. **Machine learning models** for better text detection
2. **Multi-language OCR** support
3. **Advanced mathematical symbol recognition**
4. **Real-time processing** with Web Workers
5. **Batch processing** for multiple images

### Integration Opportunities
1. **Drawing pad integration** for manual corrections
2. **Progress tracking** for homework completion
3. **Analytics dashboard** for learning insights
4. **Mobile app** with camera integration

## Troubleshooting

### Common Issues
1. **OCR not working**: Check Tesseract.js installation and browser console
2. **Bounding boxes misaligned**: Verify image dimensions and scaling
3. **Processing slow**: Consider image compression and size limits
4. **Memory errors**: Check browser memory limits for large images

### Debug Information
The system provides detailed logging for debugging:
- Processing stages and timing
- Bounding box detection results
- OCR confidence scores
- Error details and stack traces

## Dependencies

- **Tesseract.js**: OCR functionality
- **Sharp**: Server-side image processing
- **Canvas API**: Browser-based image manipulation
- **React**: UI components and state management

## Conclusion

The new image processing system significantly improves the accuracy and user experience of the homework marking feature. By providing precise bounding box coordinates and OCR text to the AI models, annotations are now placed with much greater accuracy, making the feedback more useful for students and teachers.
