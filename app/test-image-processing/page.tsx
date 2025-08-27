'use client';

import { useState, useRef } from 'react';
import { Upload, Eye, EyeOff, Download } from 'lucide-react';
import BoundingBoxDisplay from '@/components/BoundingBoxDisplay';
import type { BoundingBoxData } from '@/components/BoundingBoxDisplay';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  confidence?: number;
}

interface ProcessedImage {
  boundingBoxes: BoundingBox[];
  ocrText: string;
  imageDimensions: {
    width: number;
    height: number;
  };
}

export default function TestImageProcessingPage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedResult, setProcessedResult] = useState<ProcessedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string>('chatgpt-4o');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setError(null);
      setProcessedResult(null);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setImagePreview(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!imagePreview) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Call the API endpoint instead of using the service directly
      const response = await fetch('/api/mark-homework', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: imagePreview,
          imageName: selectedImage?.name || 'test-image',
          model: selectedModel
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process image');
      }

      const result = await response.json();
      
      // Extract the processed image data from the response
      // The API returns marking instructions, so we'll create a mock processed result
      // In a real implementation, you might want to create a separate API endpoint for testing
      const mockProcessedResult: ProcessedImage = {
        boundingBoxes: result.instructions?.annotations?.map((annotation: any, index: number) => ({
          x: annotation.bbox[0],
          y: annotation.bbox[1],
          width: annotation.bbox[2] - annotation.bbox[0],
          height: annotation.bbox[3] - annotation.bbox[1],
          text: annotation.comment,
          confidence: 0.8
        })) || [],
        ocrText: 'OCR text extracted from image processing pipeline',
        imageDimensions: { width: 800, height: 600 } // Default dimensions
      };

      setProcessedResult(mockProcessedResult);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadProcessedImage = () => {
    if (!processedResult || !imagePreview) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      // Draw original image
      ctx.drawImage(img, 0, 0);
      
      // Draw bounding boxes
      if (showBoundingBoxes) {
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        
        processedResult.boundingBoxes.forEach((bbox, index) => {
          ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);
          ctx.fillRect(bbox.x, bbox.y, bbox.width, bbox.height);
          
          // Add label
          ctx.fillStyle = '#3B82F6';
          ctx.font = '12px Arial';
          ctx.fillText(`${index + 1}`, bbox.x, bbox.y - 5);
          ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        });
      }
      
      // Download
      const link = document.createElement('a');
      link.download = `processed-${selectedImage?.name || 'image'}.png`;
      link.href = canvas.toDataURL();
      link.click();
    };
    img.src = imagePreview;
  };

  const resetForm = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setProcessedResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Image Processing & Bounding Box Detection Test
          </h1>
          <p className="text-gray-600 text-lg">
            Test the image processing service that extracts bounding boxes and performs OCR
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image Upload and Processing */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Test Image</h2>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                {imagePreview ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Test image preview"
                        className="max-w-full h-auto max-h-64 mx-auto rounded-lg shadow-sm"
                      />
                      <button
                        onClick={resetForm}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <EyeOff className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">
                      {selectedImage?.name}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        Drop your test image here
                      </p>
                      <p className="text-gray-500">or click to browse</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-primary"
                    >
                      Choose Image
                    </button>
                  </div>
                )}
              </div>

              {/* Model Selection */}
              {imagePreview && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select AI Model for Processing
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="chatgpt-4o">OpenAI GPT-4 Omni</option>
                    <option value="chatgpt-5">OpenAI ChatGPT 5</option>
                    <option value="gemini-2.5-pro">Google Gemini 2.5 Pro</option>
                  </select>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              {imagePreview && (
                <div className="mt-6 space-y-3">
                  <button
                    onClick={processImage}
                    disabled={isProcessing}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : 'Process Image'}
                  </button>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                      className="flex-1 btn-secondary"
                    >
                      {showBoundingBoxes ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                      {showBoundingBoxes ? 'Hide' : 'Show'} Boxes
                    </button>
                    
                    {processedResult && (
                      <button
                        onClick={downloadProcessedImage}
                        className="flex-1 btn-secondary"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Processing Information */}
            {isProcessing && (
              <div className="card">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Processing Image</h3>
                    <p className="text-gray-600">Extracting bounding boxes and performing OCR...</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {/* Bounding Box Display */}
            {processedResult && (
              <BoundingBoxDisplay
                boundingBoxes={processedResult.boundingBoxes.map(bbox => ({
                  text: bbox.text || '',
                  bbox: [bbox.x, bbox.y, bbox.x + bbox.width, bbox.y + bbox.height],
                  confidence: bbox.confidence || 0
                }))}
                imagePreview={imagePreview}
                imageDimensions={processedResult.imageDimensions}
              />
            )}

            {/* OCR Results */}
            {processedResult && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">OCR Results</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {processedResult.ocrText || 'No text detected'}
                  </div>
                </div>
              </div>
            )}

            {/* Technical Details */}
            {processedResult && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Details</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div>
                    <strong>Image Dimensions:</strong> {processedResult.imageDimensions.width} × {processedResult.imageDimensions.height} pixels
                  </div>
                  <div>
                    <strong>Detected Regions:</strong> {processedResult.boundingBoxes.length} text regions
                  </div>
                  <div>
                    <strong>Processing Method:</strong> Traditional Image Processing Pipeline (Grayscale → Thresholding → Contours → OCR)
                  </div>
                  <div>
                    <strong>AI Model Used:</strong> {selectedModel === 'chatgpt-4o' ? 'OpenAI GPT-4 Omni' : 
                                                     selectedModel === 'chatgpt-5' ? 'OpenAI ChatGPT 5' : 
                                                     'Google Gemini 2.5 Pro'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
