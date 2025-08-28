'use client';

import { useState, useEffect } from 'react';
import { ModelType, getDefaultModel, isModelAvailable } from '@/config/aiModels';

interface ModelSelectorProps {
  onModelChange: (model: ModelType) => void;
  initialModel?: ModelType;
  className?: string;
}

export default function ModelSelector({ onModelChange, initialModel, className = '' }: ModelSelectorProps) {
  // Use the intelligent default from configuration if no initialModel provided
  const [selectedModel, setSelectedModel] = useState<ModelType>(() => {
    if (initialModel) return initialModel;
    return getDefaultModel();
  });

  useEffect(() => {
    // Load saved model preference from localStorage
    const savedModel = localStorage.getItem('selectedModel') as ModelType;
    if (savedModel && isModelAvailable(savedModel)) {
      console.log('🔍 ModelSelector - Loading saved model:', savedModel);
      setSelectedModel(savedModel);
      onModelChange(savedModel);
    } else if (!initialModel) {
      // If no saved model or saved model not available, use intelligent default
      const defaultModel = getDefaultModel();
      console.log('🔍 ModelSelector - Using intelligent default model:', defaultModel);
      setSelectedModel(defaultModel);
      onModelChange(defaultModel);
    }
  }, [onModelChange, initialModel]);
  
  // Ensure parent component is notified of current selection
  useEffect(() => {
    console.log('🔍 ModelSelector - Notifying parent of current model:', selectedModel);
    onModelChange(selectedModel);
  }, [selectedModel, onModelChange]);

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = event.target.value as ModelType;
    console.log('🔍 ModelSelector - Model changed:', { 
      oldModel: selectedModel, 
      newModel, 
      eventValue: event.target.value 
    });
    setSelectedModel(newModel);
    localStorage.setItem('selectedModel', newModel);
    onModelChange(newModel);
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <label htmlFor="model-select" className="text-sm font-medium text-gray-300">
        Model:
      </label>
      <select
        id="model-select"
        value={selectedModel}
        onChange={handleModelChange}
                 className="px-3 py-1.5 text-sm border border-gray-800 rounded-md bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
        <option value="chatgpt-5">ChatGPT 5</option>
        <option value="chatgpt-4o">ChatGPT 4o</option>
      </select>
    </div>
  );
}
