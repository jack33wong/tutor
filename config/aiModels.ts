export type ModelType = 'gemini-2.5-pro' | 'chatgpt-5' | 'chatgpt-4o';

export interface AIModelConfig {
  id: ModelType;
  name: string;
  description: string;
  isAvailable: boolean;
  priority: number; // Higher number = higher priority for default selection
  features: {
    supportsImages: boolean;
    supportsText: boolean;
    maxTokens?: number;
  };
}

export const AI_MODELS: Record<ModelType, AIModelConfig> = {
  'gemini-2.5-pro': {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Google Gemini 2.5 Pro - Advanced AI with comprehensive knowledge',
    isAvailable: true, // Always available as it's the core service
    priority: 1, // Lower priority - fallback option
    features: {
      supportsImages: true,
      supportsText: true,
      maxTokens: 8000,
    },
  },
  'chatgpt-5': {
    id: 'chatgpt-5',
    name: 'ChatGPT 5',
    description: 'OpenAI ChatGPT 5 - Latest AI model with advanced capabilities',
    isAvailable: false, // Will be updated based on API key availability
    priority: 2, // Higher priority - preferred when available
    features: {
      supportsImages: true,
      supportsText: true,
      maxTokens: 8000,
    },
  },
  'chatgpt-4o': {
    id: 'chatgpt-4o',
    name: 'ChatGPT 4o',
    description: 'OpenAI GPT-4 Omni - Fast and efficient AI model',
    isAvailable: false, // Will be updated based on API key availability
    priority: 3, // Lower priority - fallback option
    features: {
      supportsImages: true,
      supportsText: true,
      maxTokens: 4000,
    },
  },
};

/**
 * Checks if OpenAI API is available by looking for API keys
 */
function checkOpenAIAvailability(): boolean {
  try {
    // Check environment variables (including .env.local)
    if (process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      console.log('🔍 OpenAI API key found in environment variables');
      return true;
    }
    
    // Check localStorage (client-side only)
    if (typeof window !== 'undefined') {
      const openaiKey = localStorage.getItem('openai_api_key') || localStorage.getItem('OPENAI_API_KEY');
      if (openaiKey && openaiKey.length > 20) {
        console.log('🔍 OpenAI API key found in localStorage');
        return true;
      }
    }
    
    console.log('🔍 No OpenAI API key found');
    return false;
  } catch (error) {
    console.warn('Error checking OpenAI availability:', error);
    return false;
  }
}

/**
 * Determines the default AI model based on program implementation settings
 * Priority order:
 * 1. User's saved preference from localStorage
 * 2. ChatGPT if available (preferred model)
 * 3. Gemini as fallback (always available)
 */
export function getDefaultModel(): ModelType {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    // Server-side: check environment variables for API availability
    console.log('🔍 Server-side: Checking environment variables...');
    const openAIAvailable = checkOpenAIAvailability();
    console.log('🔍 Server-side: OpenAI available =', openAIAvailable);
    
    if (openAIAvailable) {
      console.log('🔍 Server-side: OpenAI available, defaulting to ChatGPT 5');
      return 'chatgpt-5';
    }
    console.log('🔍 Server-side: OpenAI not available, defaulting to Gemini 2.5 Pro');
    return 'gemini-2.5-pro';
  }

  try {
    // Update model availability based on current environment
    const openAIAvailable = checkOpenAIAvailability();
    AI_MODELS['chatgpt-5'].isAvailable = openAIAvailable;
    AI_MODELS['chatgpt-4o'].isAvailable = openAIAvailable;
    
    console.log('🔍 AI Model Configuration:', {
      geminiAvailable: AI_MODELS['gemini-2.5-pro'].isAvailable,
      chatgpt5Available: AI_MODELS['chatgpt-5'].isAvailable,
      chatgpt4oAvailable: AI_MODELS['chatgpt-4o'].isAvailable,
      openAIAvailable,
      environment: process.env.NODE_ENV
    });

    // 1. Check user's saved preference from localStorage
    const savedModel = localStorage.getItem('selectedModel') as ModelType;
    if (savedModel && AI_MODELS[savedModel]?.isAvailable) {
      console.log('🔍 Using saved user preference:', savedModel);
      return savedModel;
    }

    // 2. Prefer ChatGPT 5 if available (higher priority)
    if (AI_MODELS['chatgpt-5'].isAvailable) {
      console.log('🔍 ChatGPT 5 available, using as default');
      return 'chatgpt-5';
    }

    // 3. Fallback to Gemini 2.5 Pro (always available)
    console.log('🔍 ChatGPT 5 not available, falling back to Gemini 2.5 Pro');
    return 'gemini-2.5-pro';
  } catch (error) {
    console.warn('Error determining default model, falling back to Gemini 2.5 Pro:', error);
    return 'gemini-2.5-pro';
  }
}

/**
 * Gets the best available model for a specific use case
 */
export function getBestModelForUseCase(useCase: 'text' | 'image' | 'general'): ModelType {
  const defaultModel = getDefaultModel();
  
  // For now, return the default model
  // In the future, this could be enhanced to consider:
  // - Model performance for specific use cases
  // - Cost considerations
  // - Response time requirements
  
  return defaultModel;
}

/**
 * Checks if a specific model is available
 */
export function isModelAvailable(modelId: ModelType): boolean {
  // Update availability before checking
  if (modelId === 'chatgpt-5' || modelId === 'chatgpt-4o') {
    const openAIAvailable = checkOpenAIAvailability();
    AI_MODELS['chatgpt-5'].isAvailable = openAIAvailable;
    AI_MODELS['chatgpt-4o'].isAvailable = openAIAvailable;
  }
  return AI_MODELS[modelId]?.isAvailable ?? false;
}

/**
 * Gets all available models for display
 */
export function getAvailableModels(): AIModelConfig[] {
  // Update availability before returning
  const openAIAvailable = checkOpenAIAvailability();
  AI_MODELS['chatgpt-5'].isAvailable = openAIAvailable;
  AI_MODELS['chatgpt-4o'].isAvailable = openAIAvailable;
  
  return Object.values(AI_MODELS).filter(model => model.isAvailable);
}
