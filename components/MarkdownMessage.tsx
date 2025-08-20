'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

type MarkdownMessageProps = {
  content: string;
  className?: string;
};

export default function MarkdownMessage({ content, className = '' }: MarkdownMessageProps) {
  
  // Function to render LaTeX expressions with better formatting
  const renderLatex = (text: string) => {
    let processedText = text;
    
    console.log('Processing LaTeX text:', text);
    
    // Log all LaTeX commands found for debugging
    const latexCommands = text.match(/\\[a-zA-Z]+(\{[^}]*\})*/g);
    if (latexCommands) {
      console.log('Found LaTeX commands:', latexCommands);
    }
    
    // Handle display math blocks \[ ... \]
    processedText = processedText.replace(/\\\[(.*?)\\\]/g, (match, latex) => {
      return `<div class="math-display" style="text-align: center; margin: 1rem 0; padding: 1rem; background: #f8f9fa; border-radius: 8px; font-family: 'Computer Modern', serif; border: 1px solid #e9ecef;">${latex}</div>`;
    });
    
    // Handle inline math \( ... \)
    processedText = processedText.replace(/\\\((.*?)\\\)/g, (match, latex) => {
      return `<span class="math-inline" style="font-family: 'Computer Modern', serif; background: #f1f3f4; padding: 2px 6px; border-radius: 4px;">${latex}</span>`;
    });
    
    // First, handle individual LaTeX symbols that might appear inside fractions
    processedText = processedText.replace(/\\cdot/g, '<span style="font-family: serif;">·</span>');
    processedText = processedText.replace(/\\cdots/g, '<span style="font-family: serif;">⋯</span>');
    processedText = processedText.replace(/\\ldots/g, '<span style="font-family: serif;">…</span>');
    processedText = processedText.replace(/\\dots/g, '<span style="font-family: serif;">…</span>');
    processedText = processedText.replace(/\\times/g, '<span style="font-family: serif;">×</span>');
    processedText = processedText.replace(/\\div/g, '<span style="font-family: serif;">÷</span>');
    processedText = processedText.replace(/\\pm/g, '<span style="font-family: serif;">±</span>');
    processedText = processedText.replace(/\\infty/g, '<span style="font-family: serif;">∞</span>');
    processedText = processedText.replace(/\\pi/g, '<span style="font-family: serif;">π</span>');
    processedText = processedText.replace(/\\theta/g, '<span style="font-family: serif;">θ</span>');
    processedText = processedText.replace(/\\alpha/g, '<span style="font-family: serif;">α</span>');
    processedText = processedText.replace(/\\beta/g, '<span style="font-family: serif;">β</span>');
    
    // Handle superscripts BEFORE fractions and other complex expressions
    processedText = processedText.replace(/([a-zA-Z0-9])\^(\d+)/g, (match, base, exponent) => {
      console.log('Found superscript:', match, 'base:', base, 'exponent:', exponent);
      return `${base}<sup style="font-size: 0.75em; vertical-align: top; line-height: 0;">${exponent}</sup>`;
    });
    
    // Handle more complex superscripts with braces
    processedText = processedText.replace(/([a-zA-Z0-9])\^\{([^}]+)\}/g, (match, base, exponent) => {
      console.log('Found complex superscript:', match, 'base:', base, 'exponent:', exponent);
      return `${base}<sup style="font-size: 0.75em; vertical-align: top; line-height: 0;">${exponent}</sup>`;
    });
    
    // Handle fractions with a more robust approach
    let fractionMatch;
    const fractionRegex = /\\frac\{([^}]+(?:\{[^}]*\}[^}]*)*)\}\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
    while ((fractionMatch = fractionRegex.exec(processedText)) !== null) {
      const fullMatch = fractionMatch[0];
      const numerator = fractionMatch[1];
      const denominator = fractionMatch[2];
      console.log('Found fraction:', fullMatch, 'num:', numerator, 'den:', denominator);
      
      const replacement = `<span style="font-family: serif; font-size: 1.1em; background: #f8f9fa; padding: 2px 6px; border-radius: 4px;">(${numerator})/(${denominator})</span>`;
      processedText = processedText.replace(fullMatch, replacement);
      
      // Reset regex lastIndex to avoid infinite loops
      fractionRegex.lastIndex = 0;
    }
    
    // Handle square roots with better nested brace handling
    let sqrtMatch;
    const sqrtRegex = /\\sqrt\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
    while ((sqrtMatch = sqrtRegex.exec(processedText)) !== null) {
      const fullMatch = sqrtMatch[0];
      const content = sqrtMatch[1];
      console.log('Found sqrt:', fullMatch, 'content:', content);
      
      const replacement = `<span style="font-family: serif;">√(${content})</span>`;
      processedText = processedText.replace(fullMatch, replacement);
      
      // Reset regex lastIndex to avoid infinite loops
      sqrtRegex.lastIndex = 0;
    }
    
    // Handle absolute values and other left/right brackets
    processedText = processedText.replace(/\\left\|([^}]+)\\right\|/g, (match, content) => {
      console.log('Found abs:', match);
      return `<span style="font-family: serif;">|${content}|</span>`;
    });
    processedText = processedText.replace(/\\left\(([^}]+)\\right\)/g, (match, content) => {
      console.log('Found parentheses:', match);
      return `<span style="font-family: serif;">(${content})</span>`;
    });
    processedText = processedText.replace(/\\left\[([^}]+)\\right\]/g, (match, content) => {
      console.log('Found brackets:', match);
      return `<span style="font-family: serif;">[${content}]</span>`;
    });
    
    // Handle bars
    processedText = processedText.replace(/\\bar\{([^}]+)\}/g, (match, content) => {
      console.log('Found bar:', match);
      return `<span style="font-family: serif; text-decoration: overline;">${content}</span>`;
    });
    

    
    console.log('Final processed text:', processedText);
    return processedText;
  };
  
  // Process the content for LaTeX
  const processedContent = renderLatex(content);
  
  return (
    <div className={className}>
      <div dangerouslySetInnerHTML={{ __html: processedContent }} />
    </div>
  );
}
