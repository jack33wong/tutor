'use client';

import React, { useEffect, useState } from 'react';
import { renderLatexToString, ensureKatexCss, LatexRenderingError } from '@/utils/latexUtils';
import 'katex/dist/katex.min.css';

interface LatexRendererProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
  showErrors?: boolean;
}

export default function LatexRenderer({ 
  latex, 
  displayMode = false, 
  className = '', 
  showErrors = true 
}: LatexRendererProps) {
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureKatexCss();

    try {
      const html = renderLatexToString(latex, displayMode);
      setRenderedHtml(html);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'LaTeX rendering failed';
      console.error('LaTeX rendering error:', err);
      setError(errorMessage);
      setRenderedHtml('');
    }
  }, [latex, displayMode]);

  if (error && showErrors) {
    return (
      <span className={`latex-error ${className}`} style={{ color: 'red', fontFamily: 'monospace' }}>
        LaTeX Error: {error}
      </span>
    );
  }

  if (error && !showErrors) {
    return (
      <span className={`latex-error ${className}`} style={{ color: 'gray', fontFamily: 'monospace' }}>
        {latex}
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
