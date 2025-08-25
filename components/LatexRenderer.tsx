'use client';

import React, { useEffect, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexRendererProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

export default function LatexRenderer({ latex, displayMode = false, className = '' }: LatexRendererProps) {
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Ensure KaTeX CSS is loaded
    if (typeof window !== 'undefined') {
      const katexCSS = document.querySelector('link[href*="katex"]');
      if (!katexCSS) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css';
        link.integrity = 'sha384-6oIt2knR4W+k54v8JmEas7ONuc6T3L/AI4rYHs+5vb7bQt3sCe5fXJf6T5Cfc';
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    }

    try {
      const html = katex.renderToString(latex, { displayMode });
      setRenderedHtml(html);
      setError(null);
    } catch (err) {
      console.error('KaTeX rendering error:', err);
      setError(err instanceof Error ? err.message : 'LaTeX rendering failed');
      setRenderedHtml('');
    }
  }, [latex, displayMode]);

  if (error) {
    return (
      <span className={`latex-error ${className}`} style={{ color: 'red', fontFamily: 'monospace' }}>
        LaTeX Error: {error}
      </span>
    );
  }

  return (
    <span 
      className={`latex-renderer ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}

// Utility function for rendering LaTeX strings to HTML
export function renderLatexToString(latex: string, displayMode: boolean = false): string {
  try {
    return katex.renderToString(latex, { displayMode });
  } catch (error) {
    console.error('KaTeX rendering error:', error);
    return `<span style="color: red; font-family: monospace;">LaTeX Error: ${error instanceof Error ? error.message : 'Unknown error'}</span>`;
  }
}

// Utility function for processing text with embedded LaTeX
export function processLatexInText(text: string): string {
  try {
    let processed = text;
    
    // Convert common LaTeX patterns to proper delimiters
    processed = processed
      .replace(/\$\$([\s\S]*?)\$\$/g, '\\[$1\\]') // Convert $$ to \[ \] ([\s\S] matches any char including newlines)
      .replace(/\$([\s\S]*?)\$/g, '\\($1\\)'); // Convert $ to \( \) ([\s\S] matches any char including newlines)

    // Render display math (\[ ... \]) - handle multi-line with [\s\S]
    processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (match, latex) => {
      try {
        return katex.renderToString(latex, { displayMode: true });
      } catch (error) {
        console.error('KaTeX display math error:', error);
        return match; // Return original if rendering fails
      }
    });

    // Render inline math (\( ... \)) - handle multi-line with [\s\S]
    processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (match, latex) => {
      try {
        return katex.renderToString(latex, { displayMode: false });
      } catch (error) {
        console.error('KaTeX inline math error:', error);
        return match; // Return original if rendering fails
      }
    });

    return processed;
  } catch (error) {
    console.error('LaTeX processing error:', error);
    return text; // Return original text if processing fails
  }
}
