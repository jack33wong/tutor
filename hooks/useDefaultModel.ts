import { useState, useEffect } from 'react';
import { ModelType } from '@/config/aiModels';

/**
 * Custom hook to determine the default AI model
 * Since the user wants ChatGPT as default, we'll use that
 */
export function useDefaultModel(): ModelType {
  const [defaultModel, setDefaultModel] = useState<ModelType>('chatgpt-5'); // Default to ChatGPT 5

  useEffect(() => {
    // Only run on client side after hydration
    if (typeof window === 'undefined') return;

    try {
      // Check user's saved preference first
      const savedModel = localStorage.getItem('selectedModel') as ModelType;
      if (savedModel && (savedModel === 'gemini-2.5-pro' || savedModel === 'chatgpt-5' || savedModel === 'chatgpt-4o')) {
        console.log('🔍 useDefaultModel: Using saved preference:', savedModel);
        setDefaultModel(savedModel);
        return;
      }

      // If no saved preference, use ChatGPT 5 as default
      console.log('🔍 useDefaultModel: No saved preference, using ChatGPT 5 as default');
      setDefaultModel('chatgpt-5');
    } catch (error) {
      console.warn('Error determining default model, using ChatGPT 5 as default:', error);
      setDefaultModel('chatgpt-5');
    }
  }, []);

  return defaultModel;
}
