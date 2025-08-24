'use client';

import { useState, useEffect } from 'react';
import { getDefaultModel, getAvailableModels, isModelAvailable, ModelType } from '@/config/aiModels';

export default function TestModelConfigPage() {
  const [defaultModel, setDefaultModel] = useState<ModelType>('gemini-2.5-pro');
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Get the intelligent default model
    const model = getDefaultModel();
    setDefaultModel(model);
    
    // Get all available models
    const models = getAvailableModels();
    setAvailableModels(models);
  }, [refreshKey]);

  const refreshConfig = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">AI Model Configuration Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Configuration */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Intelligent Default Model
                </label>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <span className="font-medium text-blue-800">{defaultModel}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Models
                </label>
                <div className="space-y-2">
                  {availableModels.map(model => (
                    <div key={model.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md">
                      <div>
                        <span className="font-medium text-gray-800">{model.name}</span>
                        <span className="text-sm text-gray-600 ml-2">({model.id})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          model.isAvailable 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {model.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                        <span className="text-xs text-gray-500">Priority: {model.priority}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Environment Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Environment Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Node Environment
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <span className="font-medium text-gray-800">{process.env.NODE_ENV || 'development'}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OpenAI API Key Status
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <span className={`font-medium ${
                    isModelAvailable('chatgpt-5') 
                      ? 'text-green-800' 
                      : 'text-red-800'
                  }`}>
                    {isModelAvailable('chatgpt-5') ? 'Available' : 'Not Available'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Local Storage
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <span className="font-medium text-gray-800">
                    {typeof window !== 'undefined' ? 'Available' : 'Not Available'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
          <div className="flex space-x-4">
            <button
              onClick={refreshConfig}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh Configuration
            </button>
            
            <button
              onClick={() => {
                localStorage.removeItem('selectedModel');
                refreshConfig();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Clear Saved Preference
            </button>
            
            <button
              onClick={() => {
                localStorage.setItem('selectedModel', 'chatgpt');
                refreshConfig();
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Set ChatGPT as Preferred
            </button>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">How the Intelligent Default Works</h2>
          <div className="space-y-3 text-gray-700">
            <p><strong>1. User Preference:</strong> Check if user has a saved model preference in localStorage</p>
            <p><strong>2. API Availability:</strong> Check if OpenAI API key is available (environment variables or localStorage)</p>
            <p><strong>3. Priority Selection:</strong> Choose the highest priority available model</p>
            <p><strong>4. Fallback:</strong> Always fallback to Gemini if no other models are available</p>
          </div>
        </div>
      </div>
    </div>
  );
}
