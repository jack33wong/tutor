'use client';

import React from 'react';
import MarkdownMessage from './MarkdownMessage';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
  imageData?: string;
  imageName?: string;
}

export default function ChatMessage({ content, role, imageData, imageName }: ChatMessageProps) {
  // Check if the message has an actual image
  const hasImage = imageData && imageName;
  
  if (!hasImage) {
    // Regular text message - use existing MarkdownMessage with top spacing for assistant
    return (
      <div className={role === 'assistant' ? 'mt-6' : ''}>
        <MarkdownMessage content={content} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Text content */}
      {content && content !== `[📷 Image: ${imageName}]` && (
        <div>
          <MarkdownMessage content={content} />
        </div>
      )}
      
      {/* Image thumbnail with actual image */}
      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="w-16 h-16 rounded-lg overflow-hidden shadow-sm border border-gray-200">
          <img 
            src={imageData} 
            alt={imageName}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to icon if image fails to load
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
          <p className="text-xs text-gray-500 mt-1">Click to view or describe what you see</p>
        </div>
      </div>
    </div>
  );
}
