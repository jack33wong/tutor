// LaTeX Configuration
export const LATEX_CONFIG = {
  // KaTeX CSS configuration
  KATEX_CSS: {
    href: 'https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css',
    integrity: 'sha384-6oIt2knR4W+k54v8JmEas7ONuc6T3L/AI4rYHs+5vb7bQt3sCe5fXJf6T5Cfc',
    crossOrigin: 'anonymous'
  },
  
  // LaTeX delimiters
  DELIMITERS: {
    DISPLAY: /\\\[([\s\S]*?)\\\]/g,      // \[ ... \]
    INLINE: /\\\(([\s\S]*?)\\\)/g,       // \( ... \)
    DOLLAR: /\$([\s\S]*?)\$/g,           // $ ... $
    DOUBLE_DOLLAR: /\$\$([\s\S]*?)\$\$/g // $$ ... $$
  },
  
  // Error display settings
  ERROR_DISPLAY: {
    SHOW_ERRORS: true,
    ERROR_COLOR: 'red',
    FALLBACK_COLOR: 'gray',
    FONT_FAMILY: 'monospace'
  },
  
  // Rendering options
  RENDERING: {
    DEFAULT_DISPLAY_MODE: false,
    ENABLE_MULTILINE: true,
    PRESERVE_ORIGINAL_ON_ERROR: true
  }
};

// LaTeX patterns for validation
export const LATEX_PATTERNS = {
  // Common LaTeX commands
  COMMANDS: {
    FRACTION: /\\frac\{[^}]*\}\{[^}]*\}/g,
    SQRT: /\\sqrt\{[^}]*\}/g,
    INTEGRAL: /\\int/g,
    SUM: /\\sum/g,
    LIMIT: /\\lim/g,
    MATRIX: /\\begin\{[^}]*\}/g
  },
  
  // Math environments
  ENVIRONMENTS: {
    EQUATION: /\\begin\{equation\}/g,
    ALIGN: /\\begin\{align\}/g,
    MATRIX: /\\begin\{matrix\}/g,
    PMATRIX: /\\begin\{pmatrix\}/g
  }
};

// LaTeX validation rules
export const LATEX_VALIDATION = {
  MAX_LENGTH: 1000,
  ALLOWED_COMMANDS: [
    'frac', 'sqrt', 'int', 'sum', 'lim', 'sin', 'cos', 'tan',
    'log', 'ln', 'exp', 'pi', 'theta', 'alpha', 'beta', 'gamma',
    'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa',
    'lambda', 'mu', 'nu', 'xi', 'omicron', 'rho', 'sigma', 'tau',
    'upsilon', 'phi', 'chi', 'psi', 'omega'
  ],
  FORBIDDEN_COMMANDS: [
    '\\input', '\\include', '\\usepackage', '\\documentclass',
    '\\begin{document}', '\\end{document}'
  ]
};
