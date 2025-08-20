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
  const processLatexText = (text: string): string => {
		let processedText = text;
		
		// Find all LaTeX commands
		const latexCommands = text.match(/\\[a-zA-Z]+/g) || [];
		
		// Process superscripts (x^2, x^{2}, x^{2+3})
		processedText = processedText.replace(/(\w+)\^(\w+)/g, (match, base, exponent) => {
			return `${base}<sup>${exponent}</sup>`;
		});
		
		processedText = processedText.replace(/(\w+)\^{([^}]+)}/g, (match, base, exponent) => {
			return `${base}<sup>${exponent}</sup>`;
		});
		
		// Process fractions (\frac{a}{b})
		processedText = processedText.replace(/\\frac{([^}]+)}{([^}]+)}/g, (fullMatch, numerator, denominator) => {
			return `<span class="inline-block text-center"><span class="block border-b border-current">${numerator}</span><span class="block">${denominator}</span></span>`;
		});
		
		// Process square roots (\sqrt{x})
		processedText = processedText.replace(/\\sqrt{([^}]+)}/g, (fullMatch, content) => {
			return `<span class="inline-block relative"><span class="absolute -top-1 left-0 text-xs">√</span><span class="ml-3">${content}</span></span>`;
		});
		
		// Process absolute value (|x|)
		processedText = processedText.replace(/\|([^|]+)\|/g, (match) => {
			return `<span class="inline-block">|${match.slice(1, -1)}|</span>`;
		});
		
		// Process parentheses
		processedText = processedText.replace(/\(([^)]+)\)/g, (match) => {
			return `<span class="inline-block">(${match.slice(1, -1)})</span>`;
		});
		
		// Process brackets
		processedText = processedText.replace(/\[([^\]]+)\]/g, (match) => {
			return `<span class="inline-block">[${match.slice(1, -1)}]</span>`;
		});
		
		// Process bars (\bar{x})
		processedText = processedText.replace(/\\bar{([^}]+)}/g, (match) => {
			return `<span class="inline-block relative"><span class="absolute -top-1 left-0 text-xs">‾</span><span class="ml-3">${match.slice(5, -1)}</span></span>`;
		});
		
		return processedText;
	};
  
  // Process the content for LaTeX
  const processedContent = processLatexText(content);
  
  return (
    <div className={className}>
      <div dangerouslySetInnerHTML={{ __html: processedContent }} />
    </div>
  );
}
