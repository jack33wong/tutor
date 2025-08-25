'use client';

import React, { useState, useEffect } from 'react';
import LatexRenderer, { renderLatexToString, processLatexInText } from './LatexRenderer';

export default function LatexInputDemo() {
  const [latexInput, setLatexInput] = useState('\\frac{3}{6} = \\frac{1}{2}');
  const [displayMode, setDisplayMode] = useState(true);
  const [mixedTextInput, setMixedTextInput] = useState('The fraction \\(\\frac{3}{6}\\) simplifies to \\(\\frac{1}{2}\\)');

  const examples = [
    { name: 'Fractions', latex: '\\frac{1}{2} + \\frac{1}{3}', display: '\\frac{1}{2} + \\frac{1}{3}' },
    { name: 'Multi-line Fractions', latex: '\\[\n\\frac{9}{18} + \\frac{10}{18} = \\frac{19}{18}\n\\]', display: 'Multi-line fraction addition' },
    { name: 'Square Root', latex: '\\sqrt{x^2 + y^2}', display: '\\sqrt{x^2 + y^2}' },
    { name: 'Integral', latex: '\\int_0^1 x^2 dx', display: '\\int_0^1 x^2 dx' },
    { name: 'Summation', latex: '\\sum_{i=1}^n i = \\frac{n(n+1)}{2}', display: '\\sum_{i=1}^n i = \\frac{n(n+1)}{2}' },
    { name: 'Matrix', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', display: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
    { name: 'Limit', latex: '\\lim_{x \\to \\infty} \\frac{1}{x} = 0', display: '\\lim_{x \\to \\infty} \\frac{1}{x} = 0' }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">LaTeX Live Renderer</h1>
      <p className="text-gray-600 mb-8">Type LaTeX expressions below and see them rendered in real-time!</p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">LaTeX Delimiters:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <code>\( ... \)</code> for inline math (smaller, in line with text)</li>
          <li>• <code>\[ ... \]</code> for display math (larger, centered, can span multiple lines)</li>
          <li>• <code>$ ... $</code> and <code>$$ ... $$</code> are automatically converted</li>
        </ul>
      </div>
      
      <div className="space-y-8">
        {/* Simple LaTeX Input */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">1. Simple LaTeX Expression</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Enter LaTeX:</label>
              <textarea
                value={latexInput}
                onChange={(e) => setLatexInput(e.target.value)}
                className="w-full p-3 border rounded-lg font-mono text-sm h-20"
                placeholder="Enter LaTeX (e.g., \frac{1}{2} or multi-line expressions)"
              />
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={displayMode}
                  onChange={(e) => setDisplayMode(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Display Mode (centered)</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Rendered Result:</label>
              <div className="p-4 bg-white border rounded-lg min-h-[60px] flex items-center justify-center">
                <LatexRenderer latex={latexInput} displayMode={displayMode} />
              </div>
            </div>
          </div>
        </div>

        {/* Mixed Text with LaTeX */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">2. Text with Embedded LaTeX</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Enter text with LaTeX:</label>
              <textarea
                value={mixedTextInput}
                onChange={(e) => setMixedTextInput(e.target.value)}
                className="w-full p-3 border rounded-lg font-mono text-sm h-24"
                placeholder="Enter text with LaTeX expressions like \( \frac{1}{2} \)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Rendered Result:</label>
              <div 
                className="p-4 bg-white border rounded-lg min-h-[60px]"
                dangerouslySetInnerHTML={{ __html: processLatexInText(mixedTextInput) }}
              />
            </div>
          </div>
        </div>

        {/* LaTeX Examples */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">3. Quick Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => setLatexInput(example.latex)}
                className="p-3 bg-blue-100 hover:bg-blue-200 rounded-lg text-left transition-colors"
              >
                <div className="font-semibold text-sm">{example.name}</div>
                <div className="text-xs text-gray-600">{example.display}</div>
              </button>
            ))}
          </div>
        </div>

        {/* LaTeX Reference */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">4. Common LaTeX Commands</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">Fractions</h3>
              <div className="space-y-1 text-xs">
                <div><code>\frac&#123;a&#125;&#123;b&#125;</code> → fraction</div>
                <div><code>\dfrac&#123;a&#125;&#123;b&#125;</code> → large fraction</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Superscripts & Subscripts</h3>
              <div className="space-y-1 text-xs">
                <div><code>x^2</code> → x²</div>
                <div><code>x_i</code> → xᵢ</div>
                <div><code>x_i^2</code> → xᵢ²</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Greek Letters</h3>
              <div className="space-y-1 text-xs">
                <div><code>\alpha, \beta, \gamma</code></div>
                <div><code>\pi, \theta, \phi</code></div>
                <div><code>\sum, \prod, \int</code></div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Roots</h3>
              <div className="space-y-1 text-xs">
                <div><code>\sqrt&#123;x&#125;</code> → √x</div>
                <div><code>\sqrt[n]&#123;x&#125;</code> → ⁿ√x</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Delimiters</h3>
              <div className="space-y-1 text-xs">
                <div><code>\( ... \)</code> → inline math</div>
                <div><code>\[ ... \]</code> → display math (multi-line)</div>
                <div><code>\left( \right)</code> → auto-sizing</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Special Symbols</h3>
              <div className="space-y-1 text-xs">
                <div><code>\pm, \mp, \times, \div</code></div>
                <div><code>\leq, \geq, \neq, \approx</code></div>
                <div><code>\infty, \partial, \nabla</code></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
