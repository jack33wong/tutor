// Note: This test script needs to be run from the project root
// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// For now, let's test the environment variable setup
async function testMathpix() {
  console.log('🧪 Testing Mathpix API setup...');
  
  try {
    // Test 1: Check environment variable
    console.log('\n1️⃣ Checking environment variables...');
    const apiKey = process.env.MATHPIX_API_KEY;
    
    if (apiKey) {
      console.log('✅ MATHPIX_API_KEY is set');
      console.log(`Key length: ${apiKey.length} characters`);
      console.log(`Key preview: ${apiKey.substring(0, 8)}...`);
    } else {
      console.log('❌ MATHPIX_API_KEY is not set');
      console.log('Please create a .env.local file with:');
      console.log('MATHPIX_API_KEY=your_api_key_here');
      return;
    }
    
    // Test 2: Test API endpoint
    console.log('\n2️⃣ Testing Mathpix API endpoint...');
    const response = await fetch('https://api.mathpix.com/v3/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'app_id': 'tutor_app',
        'app_key': apiKey
      },
      body: JSON.stringify({
        src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        formats: ['text'],
        data_options: {
          include_asciimath: true,
          include_latex: true
        }
      })
    });
    
    if (response.ok) {
      console.log('✅ Mathpix API endpoint is accessible');
      const result = await response.json();
      console.log('API Response:', result);
    } else {
      console.log('❌ Mathpix API endpoint test failed');
      console.log(`Status: ${response.status} ${response.statusText}`);
      const errorData = await response.json().catch(() => ({}));
      console.log('Error details:', errorData);
    }
    
    console.log('\n✅ Mathpix setup test completed!');
    
  } catch (error) {
    console.error('❌ Mathpix test failed:', error);
  }
}

// Run the test
testMathpix().catch(console.error);
