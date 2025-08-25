import katex from 'katex';

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
    console.error('KaTeX rendering error:', error);
    return `<span style="color: red; font-family: monospace;">LaTeX Error: ${error instanceof Error ? error.message : 'Unknown error'}</span>`;
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
      .replace(/\$\$(.*?)\$\$/g, '\\[$1\\]') // Convert $$ to \[ \]
      .replace(/\$(.*?)\$/g, '\\($1\\)'); // Convert $ to \( \)

    // Render display math (\[ ... \])
    processed = processed.replace(/\\\[(.*?)\\\]/g, (match, latex) => {
      try {
        return katex.renderToString(latex, { displayMode: true });
      } catch (error) {
        console.error('KaTeX display math error:', error);
        return match; // Return original if rendering fails
      }
    });

    // Render inline math (\( ... \))
    processed = processed.replace(/\\\((.*?)\\\)/g, (match, latex) => {
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
 * Ensures KaTeX CSS is loaded in the browser
 */
export function ensureKatexCss(): void {
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
  const displayMatches = text.match(/\\\[(.*?)\\\]/g);
  if (displayMatches) {
    expressions.push(...displayMatches.map(match => match.slice(2, -2)));
  }
  
  // Find inline math \( ... \)
  const inlineMatches = text.match(/\\\((.*?)\\\)/g);
  if (inlineMatches) {
    expressions.push(...inlineMatches.map(match => match.slice(2, -2)));
  }
  
  // Find $ ... $ expressions
  const dollarMatches = text.match(/\$(.*?)\$/g);
  if (dollarMatches) {
    expressions.push(...dollarMatches.map(match => match.slice(1, -1)));
  }
  
  // Find $$ ... $$ expressions
  const doubleDollarMatches = text.match(/\$\$(.*?)\$\$/g);
  if (doubleDollarMatches) {
    expressions.push(...doubleDollarMatches.map(match => match.slice(2, -2)));
  }
  
  return expressions;
}


