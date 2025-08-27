'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, FileImage, CheckCircle, XCircle, Loader2, Download } from 'lucide-react';
import LeftSidebar from '@/components/LeftSidebar';
import ChatHistory from '@/components/ChatHistory';
import ModelSelector from '@/components/ModelSelector';
import { ModelType } from '@/config/aiModels';
// Removed useDefaultModel hook to fix display issues

interface MarkingResult {
  markedImage: string;
  instructions: any;
  ocrResults: Array<{
    text: string;
    bbox: [number, number, number, number];
    confidence: number;
  }>;
  message: string;
  apiUsed?: string;
  ocrMethod?: string;
}

export default function MarkHomeworkPage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [markingResult, setMarkingResult] = useState<MarkingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<any>(null);
      const [selectedModel, setSelectedModel] = useState<ModelType>('chatgpt-4o'); // Default to ChatGPT 4o for homework marking
  
  // Log when selectedModel changes
  useEffect(() => {
    console.log('🔍 Mark Homework Page - selectedModel changed:', selectedModel);
  }, [selectedModel]);
  
  // Load saved model preference on component mount
  useEffect(() => {
    const savedModel = localStorage.getItem('selectedModel') as ModelType;
    if (savedModel && (savedModel === 'gemini-2.5-pro' || savedModel === 'chatgpt-5' || savedModel === 'chatgpt-4o')) {
      console.log('🔍 Mark Homework Page - Loading saved model:', savedModel);
      setSelectedModel(savedModel);
    }
  }, []);
  const [chatSessions, setChatSessions] = useState<Array<{
    id: string;
    title: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    timestamp: Date | string;
  }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      // Validate file size
      if (file.size < 1000) {
        setError('Image file is too small. Please select a larger image file.');
        return;
      }
      
      if (file.size > 10000000) { // 10MB limit
        setError('Image file is too large. Please select an image smaller than 10MB.');
        return;
      }
      
      setSelectedImage(file);
      setError(null);
      setMarkingResult(null);
      
      // Create preview with better error handling
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        
        if (result && result.length > 100) {
          setImagePreview(result);
        } else {
          setError('Failed to read image file. Please try again.');
          setSelectedImage(null);
        }
      };
      
      reader.onerror = () => {
        setError('Error reading image file. Please try again.');
        setSelectedImage(null);
      };
      
      reader.readAsDataURL(file);
    } else {
      setError('Please select a valid image file.');
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        // Validate file size
        if (file.size < 1000) {
          setError('Image file is too small. Please select a larger image file.');
          return;
        }
        
        if (file.size > 10000000) { // 10MB limit
          setError('Image file is too large. Please select an image smaller than 10MB.');
          return;
        }
        
        setSelectedImage(file);
        setError(null);
        setMarkingResult(null);
        
        // Create preview with better error handling
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          
          if (result && result.length > 100) {
            setImagePreview(result);
          } else {
            setError('Failed to read image file. Please try again.');
            setSelectedImage(null);
          }
        };
        
        reader.onerror = () => {
          setError('Error reading image file. Please try again.');
          setSelectedImage(null);
        };
        
        reader.readAsDataURL(file);
      } else {
        setError('Please select a valid image file.');
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const markHomework = async () => {
    if (!selectedImage || !imagePreview) return;
    
    // Additional validation before sending
    if (imagePreview.length < 1000) {
      setError('Image data is corrupted. Please try uploading the image again.');
      return;
    }
    
    if (!imagePreview.startsWith('data:image/')) {
      setError('Invalid image format. Please try uploading the image again.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setMarkingResult(null);

    try {
      const requestBody = {
        imageData: imagePreview,
        imageName: selectedImage.name,
        model: selectedModel,
      };
      
      console.log('🔍 Frontend - Sending request with model:', {
        selectedModel,
        hasModel: !!selectedModel,
        modelType: typeof selectedModel
      });
      
      const response = await fetch('/api/mark-homework', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        setMarkingResult(result);
      } else {
        const errorData = await response.json();
        
        // Display detailed error information
        let errorMessage = errorData.error || 'Failed to mark homework';
        
        if (errorData.errorDetails) {
          setDetailedError(errorData.errorDetails);
          
          // Add additional error details to the message
          if (errorData.errorDetails.additionalDetails) {
            const details = errorData.errorDetails.additionalDetails;
            if (details.errorData?.error?.message) {
              errorMessage += `: ${details.errorData.error.message}`;
            }
            if (details.status) {
              errorMessage += ` (Status: ${details.status})`;
            }
          }
        } else {
          setDetailedError(null);
        }
        
        setError(errorMessage);
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadMarkedImage = () => {
    if (markingResult?.markedImage) {
      const link = document.createElement('a');
      link.href = markingResult.markedImage;
      link.download = `marked-${selectedImage?.name || 'homework'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setMarkingResult(null);
    setError(null);
    setDetailedError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        <LeftSidebar>
          <ChatHistory chatSessions={chatSessions} />
        </LeftSidebar>

        <main className="flex-1 flex flex-col">
          {/* Header with Model Selector - matching main chat page design */}
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center space-x-4">
                <ModelSelector 
                  onModelChange={setSelectedModel}
                  initialModel={selectedModel}
                  className="justify-start"
                />
                <div className="text-sm text-gray-600">
                  Current Model: <span className="font-medium text-blue-600">{selectedModel === 'chatgpt-5' ? 'ChatGPT 5' : selectedModel === 'chatgpt-4o' ? 'ChatGPT 4o' : 'Gemini 2.5 Pro'}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-4xl mx-auto">
              {/* Description below header */}
              <div className="mb-8 text-center">
                <p className="text-gray-600 text-lg">
                  Upload a photo of student homework and get AI-powered marking with red pen corrections
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Image Upload and Processing */}
                <div className="space-y-6">
                  {/* Image Upload Area */}
                  <div className="card">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Homework Image</h2>
                    
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        imagePreview 
                          ? 'border-green-300 bg-green-50' 
                          : 'border-gray-300 hover:border-primary-400'
                      }`}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                    >
                      {imagePreview ? (
                        <div className="space-y-4">
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt="Homework preview"
                              className="max-w-full h-auto max-h-64 mx-auto rounded-lg shadow-sm"
                            />
                            <button
                              onClick={resetForm}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
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
                              Drop your homework image here
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

                    {/* Error Display */}
                    {error && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <XCircle className="w-5 h-5 text-red-500" />
                          <span className="text-red-700">{error}</span>
                        </div>
                      </div>
                    )}

                    {/* Detailed Error Debug Panel */}
                    {detailedError && (
                      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Debug Information</h4>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div><strong>Error Type:</strong> {detailedError.name}</div>
                          <div><strong>Message:</strong> {detailedError.message}</div>
                          {detailedError.additionalDetails && (
                            <>
                              <div><strong>Status:</strong> {detailedError.additionalDetails.status}</div>
                              <div><strong>Status Text:</strong> {detailedError.additionalDetails.statusText}</div>
                              {detailedError.additionalDetails.errorData?.error?.message && (
                                <div><strong>OpenAI Error:</strong> {detailedError.additionalDetails.errorData.error.message}</div>
                              )}
                              {detailedError.additionalDetails.errorData?.error?.code && (
                                <div><strong>Error Code:</strong> {detailedError.additionalDetails.errorData.error.code}</div>
                              )}
                            </>
                          )}
                          <details className="mt-2">
                            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">View Full Stack Trace</summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                              {detailedError.stack}
                            </pre>
                          </details>
                        </div>
                      </div>
                    )}

                    {/* Process Button */}
                    {imagePreview && (
                      <div className="mt-6">
                        <button
                          onClick={markHomework}
                          disabled={isProcessing}
                          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? (
                            <div className="flex items-center justify-center">
                              <Loader2 className="w-5 h-5 animate-spin mr-2" />
                              Processing Homework...
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <span className="text-xl mr-2">✔</span>
                              Mark This Homework
                            </div>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Processing Status */}
                  {isProcessing && (
                    <div className="card">
                      <div className="text-center space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Processing Your Homework</h3>
                          <p className="text-gray-600">This may take a few moments...</p>
                        </div>
                                                         <div className="space-y-2 text-sm text-gray-500">
                                   <div className="flex items-center justify-center space-x-2">
                                     <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                     <span>Stage 1: AI analysis of homework image</span>
                                   </div>
                                   <div className="flex items-center justify-center space-x-2">
                                     <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                     <span>Stage 2: Generating marking instructions</span>
                                   </div>
                                   <div className="flex items-center justify-center space-x-2">
                                     <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                     <span>Stage 3: Applying annotations with Sharp</span>
                                   </div>
                                 </div>
                      </div>
                    </div>
                  )}
                </div>

                                         {/* Right Column - Results */}
                         <div className="space-y-6">

                           
                           {/* Marking Instructions */}
                           {markingResult?.instructions && (
                    <div className="card">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Marking Instructions</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(markingResult.instructions, null, 2)}
                        </pre>
                        {/* Model API version footer */}
                        <div className="mt-3 pt-2 border-t border-gray-200">
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>OCR: {markingResult?.ocrMethod || 'Unknown'}</span>
                            <span>Powered by {markingResult?.apiUsed || 'AI Assistant'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Marked Image Result */}
                  {markingResult?.markedImage && (
                    <div className="card">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Marked Homework</h3>
                        <button
                          onClick={downloadMarkedImage}
                          className="btn-secondary flex items-center space-x-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <img
                          src={markingResult.markedImage}
                          alt="Marked homework"
                          className="w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                        />
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-xl text-green-600">✔</span>
                            <span className="text-green-800 font-medium">
                              {markingResult.message}
                            </span>
                          </div>
                          {/* Model API version footer */}
                          <div className="mt-3 pt-2 border-t border-green-200">
                            <div className="flex justify-between items-center text-xs text-green-600">
                              <span>OCR: {markingResult?.ocrMethod || 'Unknown'}</span>
                              <span>Powered by {markingResult?.apiUsed || 'AI Assistant'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* How It Works */}
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                          1
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">OCR & AI Image Analysis</h4>
                          <p className="text-sm text-gray-600">
                            Mathpix API performs advanced OCR to extract mathematical text and equations, then {selectedModel === 'gemini-2.5-pro' ? 'Gemini 2.5 Pro' : selectedModel === 'chatgpt-5' ? 'ChatGPT 5' : 'GPT-4 Omni'} analyzes the content to identify mathematical errors.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                          2
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Marking Instructions</h4>
                          <p className="text-sm text-gray-600">
                            The AI generates structured instructions for placing red pen corrections on the image.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                          3
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Image Processing</h4>
                          <p className="text-sm text-gray-600">
                            Sharp image processing library applies red pen annotations using SVG overlays.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <footer className="mt-8 border-t border-gray-200 bg-gray-50">
                <div className="max-w-6xl mx-auto px-6 py-4">
                  <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
                    <div className="flex items-center space-x-4 mb-2 sm:mb-0">
                      <span>© 2024 Mentara Tutor</span>
                      <span>•</span>
                      <span>AI-Powered Learning</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>Current Model:</span>
                      <span className="font-medium text-blue-600">
                        {selectedModel === 'gemini-2.5-pro' ? 'Google Gemini 2.5 Pro' : selectedModel === 'chatgpt-5' ? 'OpenAI ChatGPT 5' : 'OpenAI GPT-4 Omni'}
                      </span>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
