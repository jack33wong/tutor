'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

type MarkdownMessageProps = {
  content: string;
  className?: string;
  isGeometryResponse?: boolean;
};

export default function MarkdownMessage({ content, className = '', isGeometryResponse = false }: MarkdownMessageProps) {
  // Check if content is JSON for geometry responses
  const isJsonContent = (text: string): boolean => {
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  };

  // Format JSON for display
  const formatJson = (jsonString: string): string => {
    try {
      const parsed = JSON.parse(jsonString);
      return `<pre style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 1rem; overflow-x: auto; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 0.9em; line-height: 1.4;">${JSON.stringify(parsed, null, 2)}</pre>`;
    } catch {
      return `<pre style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 1rem; overflow-x: auto; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 0.9em; line-height: 1.4; color: #dc3545;">Invalid JSON: ${jsonString}</pre>`;
    }
  };

  // If this is a geometry response and contains JSON, format it
  if (isGeometryResponse && isJsonContent(content)) {
    return (
      <div className={className}>
        <div dangerouslySetInnerHTML={{ __html: formatJson(content) }} />
      </div>
    );
  }

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{
          // Custom components for better styling
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-semibold mb-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-medium mb-2">{children}</h3>,
          p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="ml-2">{children}</li>,
          blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4">{children}</blockquote>,
          code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
          pre: ({ children }) => <pre className="bg-gray-100 p-3 rounded overflow-x-auto text-sm">{children}</pre>,
          hr: () => <hr className="border-gray-300 my-6" />,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic text-gray-500">{children}</em>,
          small: ({ children, ...props }) => (
            <small 
              className="text-xs text-gray-500 block mb-2" 
              style={{ fontSize: '0.75em', lineHeight: '1.3' }}
              {...props}
            >
              {children}
            </small>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
