'use client';

import React from 'react';
import MarkdownMessage from './MarkdownMessage';
import { ModelType } from '@/config/aiModels';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
  imageData?: string;
  imageName?: string;
  model?: ModelType | string; // Allow both ModelType and string for flexibility
  apiUsed?: string; // Specific API that was used for this response
}

export default function ChatMessage({ content, role, imageData, imageName, model, apiUsed }: ChatMessageProps) {
  // Check if the message has an actual image
  const hasImage = imageData && imageName;
  
  // Get model display name with exact backend version
  const getModelDisplayName = (modelType: ModelType | string): string => {
    switch (modelType) {
      case 'gemini-2.5-pro':
        return 'Google Gemini 2.5 Pro';
      case 'gemini-2.0-flash-exp':
        return 'Google Gemini 2.0 Flash';
      case 'chatgpt-5':
        return 'OpenAI ChatGPT 5';
      case 'chatgpt-4o':
        return 'OpenAI GPT-4 Omni';
      case 'gpt-5':
        return 'OpenAI GPT-5';
      case 'gpt-4o':
        return 'OpenAI GPT-4 Omni';
      default:
        // If it's a string but not a known ModelType, return it as is
        if (typeof modelType === 'string') {
          return modelType;
        }
        return 'AI Assistant';
    }
  };

  // Get API display name - prioritize apiUsed if available, otherwise use model
  const getAPIDisplayName = (): string => {
    if (apiUsed && apiUsed !== 'Error Response') {
      // If apiUsed is provided and not an error, use it directly
      return apiUsed;
    }
    // Fall back to model-based display name
    if (model) {
      return getModelDisplayName(model);
    }
    return 'AI Assistant';
  };
  
  if (!hasImage) {
    // Regular text message with Gemini-style layout
    if (role === 'user') {
      // User message - aligned to right with blue background
      return (
        <div className="flex justify-end mb-4">
          <div className="max-w-[80%] bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
            <MarkdownMessage content={content} />
          </div>
        </div>
      );
    } else {
      // Assistant message - aligned to left with white background
      return (
        <div className="flex justify-start mb-4">
          <div className="min-w-[600px] max-w-[80%] bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
            <MarkdownMessage content={content} />
            {/* Add API info footer for assistant messages */}
            {(model || apiUsed) && (
              <div className="mt-3 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-right">
                  Powered by {getAPIDisplayName()}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }
  }

  // Image message with Gemini-style layout
  if (role === 'user') {
    // User image message - aligned to right with blue background
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%] bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
          {/* Text content if any */}
          {content && content !== `[📷 Image: ${imageName}]` && (
            <div className="mb-3">
              <MarkdownMessage content={content} />
            </div>
          )}
          
          {/* Image thumbnail */}
          <div className="flex items-center space-x-3">
            <div className="w-16 h-16 rounded-lg overflow-hidden shadow-sm border border-blue-400">
              <img 
                src={imageData} 
                alt={imageName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              {/* Fallback icon */}
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center hidden">
                <span className="text-blue-600 text-lg">📷</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-100">Image attached</p>
              <p className="text-xs text-blue-200 mt-1">{imageName}</p>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    // Assistant image message - aligned to left with white background
    return (
      <div className="flex justify-start mb-4">
        <div className="min-w-[600px] max-w-[80%] bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
          {/* Text content if any */}
          {content && content !== `[📷 Image: ${imageName}]` && (
            <div className="mb-3">
              <MarkdownMessage content={content} />
            </div>
          )}
          
          {/* Image thumbnail */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="w-16 h-16 rounded-lg overflow-hidden shadow-sm border border-gray-200">
              <img 
                src={imageData} 
                alt={imageName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              {/* Fallback icon */}
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center hidden">
                <span className="text-blue-600 text-lg">📷</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">Image attached</p>
              <p className="text-xs text-gray-600 mt-1">{imageName}</p>
            </div>
          </div>
          
          {/* API info footer */}
          {(model || apiUsed) && (
            <div className="mt-3 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-right">
                Powered by {getAPIDisplayName()}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
}
