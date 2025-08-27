'use client';

import { useState } from 'react';

export default function TestTesseractFix() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [processingResult, setProcessingResult] = useState<any>(null);

  const testTesseract = async () => {
    setIsLoading(true);
    setTestResult('Testing Tesseract.js...');
    
    try {
      // Test Tesseract availability through API
      const response = await fetch('/api/process-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' // 1x1 transparent PNG
        })
      });
      
      if (response.ok) {
        setTestResult('✅ Tesseract.js is working! Image processing service is available.');
      } else {
        const errorData = await response.json();
        setTestResult(`❌ Tesseract.js failed: ${errorData.details || 'Unknown error'}`);
      }
    } catch (error) {
      setTestResult(`❌ Test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const processImage = async () => {
    if (!imageFile) {
      setTestResult('❌ Please select an image file first');
      return;
    }

    setIsLoading(true);
    setTestResult('Processing image...');
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string;
          
          // Call the API route instead of importing the service
          const response = await fetch('/api/process-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageData: base64Data })
          });
          
          if (response.ok) {
            const data = await response.json();
            setProcessingResult(data.result);
            setTestResult(`✅ Image processed successfully! Found ${data.result.boundingBoxes.length} regions`);
          } else {
            const errorData = await response.json();
            setTestResult(`❌ Image processing failed: ${errorData.details || 'Unknown error'}`);
          }
        } catch (error) {
          setTestResult(`❌ Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
          setIsLoading(false);
        }
      };
      
      reader.readAsDataURL(imageFile);
    } catch (error) {
      setTestResult(`❌ Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const cleanup = async () => {
    setIsLoading(true);
    setTestResult('Cleaning up...');
    
    try {
      // Cleanup is handled automatically by the server
      setTestResult('✅ Cleanup completed (server-side cleanup is automatic)');
    } catch (error) {
      setTestResult(`❌ Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Tesseract.js Fix Test</h1>
      
      <div className="space-y-6">
        {/* Test Tesseract Availability */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Test Tesseract.js Availability</h2>
          <button
            onClick={testTesseract}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
          >
            {isLoading ? 'Testing...' : 'Test Tesseract.js'}
          </button>
          {testResult && (
            <div className="mt-4 p-3 bg-gray-100 rounded">
              <pre className="whitespace-pre-wrap">{testResult}</pre>
            </div>
          )}
        </div>

        {/* Image Processing Test */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Test Image Processing</h2>
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button
              onClick={processImage}
              disabled={isLoading || !imageFile}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
            >
              {isLoading ? 'Processing...' : 'Process Image'}
            </button>
          </div>
        </div>

        {/* Cleanup */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Cleanup Resources</h2>
          <button
            onClick={cleanup}
            disabled={isLoading}
            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
          >
            {isLoading ? 'Cleaning...' : 'Cleanup Resources'}
          </button>
        </div>

        {/* Results Display */}
        {processingResult && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Processing Results</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Image Dimensions:</h3>
                <p>{processingResult.imageDimensions.width} x {processingResult.imageDimensions.height}</p>
              </div>
              <div>
                <h3 className="font-semibold">Full OCR Text:</h3>
                <div className="bg-gray-100 p-3 rounded max-h-40 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">{processingResult.ocrText}</pre>
                </div>
              </div>
              <div>
                <h3 className="font-semibold">Detected Regions ({processingResult.boundingBoxes.length}):</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {processingResult.boundingBoxes.map((bbox: any, index: number) => (
                    <div key={index} className="bg-gray-100 p-3 rounded">
                      <div className="font-mono text-sm">
                        Region {index + 1}: [{bbox.x}, {bbox.y}, {bbox.width}x{bbox.height}]
                      </div>
                      <div className="mt-1">
                        <strong>Text:</strong> "{bbox.text || 'No text detected'}"
                      </div>
                      <div className="mt-1">
                        <strong>Confidence:</strong> {((bbox.confidence || 0) * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
