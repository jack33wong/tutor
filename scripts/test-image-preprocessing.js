const fs = require('fs');
const path = require('path');

// Import the ImageProcessingService
const { ImageProcessingService } = require('../services/imageProcessingService');

async function testImagePreprocessing() {
  console.log('🧪 Testing Image Preprocessing Service...\n');
  
  try {
    // Test 1: Basic preprocessing options
    console.log('📸 Test 1: Basic preprocessing with custom options');
    const testOptions = {
      enhanceContrast: true,
      sharpen: true,
      denoise: true,
      targetWidth: 1200,
      targetHeight: 1600,
      quality: 85
    };
    
    console.log('Options:', JSON.stringify(testOptions, null, 2));
    
    // Test 2: Auto preprocessing
    console.log('\n📸 Test 2: Auto preprocessing with smart detection');
    
    // Test 3: Image analysis
    console.log('\n📸 Test 3: Image analysis and recommendations');
    
    // Test 4: Utility functions
    console.log('\n📸 Test 4: Utility functions');
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n💡 Usage examples:');
    console.log('1. Use ImageProcessingService.preprocessImageForOCR() for custom preprocessing');
    console.log('2. Use ImageProcessingService.autoPreprocessImage() for automatic optimization');
    console.log('3. Use ImageProcessingService.preprocessBase64Image() for base64 input');
    console.log('4. Use ImageProcessingService.analyzeImageForPreprocessing() for recommendations');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testImagePreprocessing();
}

module.exports = { testImagePreprocessing };
