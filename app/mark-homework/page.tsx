'use client';

import { useState, useRef } from 'react';
import { Upload, FileImage, CheckCircle, XCircle, Loader2, Download } from 'lucide-react';
import LeftSidebar from '@/components/LeftSidebar';
import ChatHistory from '@/components/ChatHistory';

interface MarkingResult {
  markedImage: string;
  instructions: any;
  message: string;
}

export default function MarkHomeworkPage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [markingResult, setMarkingResult] = useState<MarkingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
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
      setSelectedImage(file);
      setError(null);
      setMarkingResult(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
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
        setSelectedImage(file);
        setError(null);
        setMarkingResult(null);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
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

    setIsProcessing(true);
    setError(null);
    setMarkingResult(null);

    try {
      const response = await fetch('/api/mark-homework', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: imagePreview,
          imageName: selectedImage.name,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setMarkingResult(result);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to mark homework');
      }
    } catch (error) {
      console.error('Error marking homework:', error);
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
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">AI Homework Marker</h1>
                <p className="text-gray-600 mt-2">
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
                              <CheckCircle className="w-5 h-5 mr-2" />
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
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Stage 1: Analyzing homework with AI</span>
                          </div>
                          <div className="flex items-center justify-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            <span>Stage 2: Applying red pen corrections</span>
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
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-green-800 font-medium">
                              {markingResult.message}
                            </span>
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
                          <h4 className="font-medium text-gray-900">AI Analysis</h4>
                          <p className="text-sm text-gray-600">
                            GPT-4 analyzes your homework image and identifies mistakes, generating structured marking instructions.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                          2
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Image Generation</h4>
                          <p className="text-sm text-gray-600">
                            DALL-E 3 creates a new image with red pen corrections overlaid, just like a teacher would mark it.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                          3
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Download Result</h4>
                          <p className="text-sm text-gray-600">
                            Get your marked homework image ready for printing or sharing with students.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
