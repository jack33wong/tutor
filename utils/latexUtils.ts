import katex from 'katex';
import { LATEX_CONFIG } from '@/config/latex';

/**
 * Ensures KaTeX CSS is loaded in the browser
 */
export function ensureKatexCss(): void {
  if (typeof window === 'undefined') return;
  
  const katexCSS = document.querySelector('link[href*="katex"]');
  if (katexCSS) return;
  
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = LATEX_CONFIG.KATEX_CSS.href;
  link.integrity = LATEX_CONFIG.KATEX_CSS.integrity;
  link.crossOrigin = LATEX_CONFIG.KATEX_CSS.crossOrigin;
  document.head.appendChild(link);
}

/**
 * Renders a LaTeX string to HTML using KaTeX
 * @param latex - The LaTeX string to render
 * @param displayMode - Whether to render in display mode (centered, larger) or inline mode
 * @returns HTML string with rendered math
 */
export function renderLatexToString(latex: string, displayMode: boolean = false): string {
  try {
    return katex.renderToString(latex, { displayMode });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('KaTeX rendering error:', error);
    return `<span style="color: red; font-family: monospace;">LaTeX Error: ${errorMessage}</span>`;
  }
}

/**
 * Processes text containing embedded LaTeX and renders it
 * @param text - Text that may contain LaTeX expressions
 * @returns Text with LaTeX expressions rendered as HTML
 */
export function processLatexInText(text: string): string {
  try {
    let processed = text;
    
    // Convert common LaTeX patterns to proper delimiters
    processed = processed
      .replace(LATEX_CONFIG.DELIMITERS.DOUBLE_DOLLAR, '\\[$1\\]') // Convert $$ to \[ \]
      .replace(LATEX_CONFIG.DELIMITERS.DOLLAR, '\\($1\\)'); // Convert $ to \( \)

    // Render display math (\[ ... \])
    processed = processed.replace(LATEX_CONFIG.DELIMITERS.DISPLAY, (match, latex) => {
      try {
        return katex.renderToString(latex, { displayMode: true });
      } catch (error) {
        console.error('KaTeX display math error:', error);
        return match; // Return original if rendering fails
      }
    });

    // Render inline math (\( ... \))
    processed = processed.replace(LATEX_CONFIG.DELIMITERS.INLINE, (match, latex) => {
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

/**
 * Validates if a string contains valid LaTeX
 * @param latex - The LaTeX string to validate
 * @returns True if valid, false otherwise
 */
export function isValidLatex(latex: string): boolean {
  try {
    katex.renderToString(latex);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts LaTeX expressions from text
 * @param text - Text that may contain LaTeX expressions
 * @returns Array of found LaTeX expressions
 */
export function extractLatexExpressions(text: string): string[] {
  const expressions: string[] = [];
  
  // Find display math \[ ... \]
  const displayMatches = text.match(LATEX_CONFIG.DELIMITERS.DISPLAY);
  if (displayMatches) {
    expressions.push(...displayMatches.map(match => match.slice(2, -2)));
  }
  
  // Find inline math \( ... \)
  const inlineMatches = text.match(LATEX_CONFIG.DELIMITERS.INLINE);
  if (inlineMatches) {
    expressions.push(...inlineMatches.map(match => match.slice(2, -2)));
  }
  
  // Find $ ... $ expressions
  const dollarMatches = text.match(LATEX_CONFIG.DELIMITERS.DOLLAR);
  if (dollarMatches) {
    expressions.push(...dollarMatches.map(match => match.slice(1, -1)));
  }
  
  // Find $$ ... $$ expressions
  const doubleDollarMatches = text.match(LATEX_CONFIG.DELIMITERS.DOUBLE_DOLLAR);
  if (doubleDollarMatches) {
    expressions.push(...doubleDollarMatches.map(match => match.slice(2, -2)));
  }
  
  return expressions;
}

/**
 * Checks if text contains LaTeX patterns
 * @param text - Text to check
 * @returns True if LaTeX patterns are found
 */
export function hasLatexPatterns(text: string): boolean {
  return Object.values(LATEX_CONFIG.DELIMITERS).some((pattern: RegExp) => pattern.test(text));
}

/**
 * LaTeX rendering error class for better error handling
 */
export class LatexRenderingError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'LatexRenderingError';
  }
}


