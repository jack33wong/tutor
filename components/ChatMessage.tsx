'use client';

import React from 'react';
import MarkdownMessage from './MarkdownMessage';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
}

export default function ChatMessage({ content, role }: ChatMessageProps) {
  // Check if the message contains an image reference
  const hasImage = content.includes('[📷 Image:');
  
  if (!hasImage) {
    // Regular text message - use existing MarkdownMessage
    return <MarkdownMessage content={content} />;
  }

  // Message with image - extract text and image info
  const parts = content.split('[📷 Image:');
  const textContent = parts[0].trim();
  const imageInfo = parts[1]?.split(']')[0]?.trim() || '';

  return (
    <div className="space-y-3">
      {/* Text content */}
      {textContent && (
        <div>
          <MarkdownMessage content={textContent} />
        </div>
      )}
      
      {/* Image thumbnail */}
      {imageInfo && (
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-blue-600 text-lg">📷</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">Image attached</p>
            <p className="text-xs text-gray-600 mt-1">{imageInfo}</p>
            <p className="text-xs text-gray-500 mt-1">Click to view or describe what you see</p>
          </div>
        </div>
      )}
    </div>
  );
}
