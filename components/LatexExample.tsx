'use client';

import React, { useState } from 'react';
import LatexRenderer from './LatexRenderer';
import { renderLatexToString, processLatexInText } from '@/utils/latexUtils';

export default function LatexExample() {
  const [inputLatex, setInputLatex] = useState('\\frac{3}{6} = \\frac{1}{2}');
  const [inputText, setInputText] = useState('The fraction \\frac{3}{6} simplifies to \\frac{1}{2}');

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">LaTeX Rendering Examples</h1>
      
      <div className="space-y-8">
        {/* Example 1: Simple LaTeX Renderer Component */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">1. Simple LaTeX Renderer Component</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Inline Math:</label>
              <LatexRenderer latex="\frac{3}{6} = \frac{1}{2}" displayMode={false} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Display Math:</label>
              <LatexRenderer latex="\frac{3}{6} = \frac{3 \div 3}{6 \div 3} = \frac{1}{2}" displayMode={true} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Complex Math:</label>
              <LatexRenderer latex="\int_{0}^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}" displayMode={true} />
            </div>
          </div>
        </div>

        {/* Example 2: Interactive LaTeX Input */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">2. Interactive LaTeX Input</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Enter LaTeX:</label>
              <input
                type="text"
                value={inputLatex}
                onChange={(e) => setInputLatex(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter LaTeX (e.g., \frac{1}{2})"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Rendered Result:</label>
              <div className="p-3 bg-white border rounded">
                <LatexRenderer latex={inputLatex} displayMode={true} />
              </div>
            </div>
          </div>
        </div>

        {/* Example 3: Text with Embedded LaTeX */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">3. Text with Embedded LaTeX</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Text with LaTeX:</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full p-2 border rounded h-20"
                placeholder="Enter text with LaTeX expressions"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Rendered Result:</label>
              <div 
                className="p-3 bg-white border rounded"
                dangerouslySetInnerHTML={{ __html: processLatexInText(inputText) }}
              />
            </div>
          </div>
        </div>

        {/* Example 4: Utility Function Examples */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">4. Utility Function Examples</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Using renderLatexToString:</label>
              <div 
                className="p-3 bg-white border rounded"
                dangerouslySetInnerHTML={{ 
                  __html: renderLatexToString('\\frac{a}{b} + \\frac{c}{d} = \\frac{ad + bc}{bd}', true) 
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Mixed Content:</label>
              <div 
                className="p-3 bg-white border rounded"
                dangerouslySetInnerHTML={{ 
                  __html: processLatexInText('The quadratic formula is \\(x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\\) and the area of a circle is \\(A = \\pi r^2\\)') 
                }}
              />
            </div>
          </div>
        </div>

        {/* Example 5: Common LaTeX Patterns */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">5. Common LaTeX Patterns</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Fractions:</h3>
              <LatexRenderer latex="\frac{3}{6} = \frac{1}{2}" displayMode={false} />
            </div>
            <div>
              <h3 className="font-medium mb-2">Square Roots:</h3>
              <LatexRenderer latex="\sqrt{16} = 4" displayMode={false} />
            </div>
            <div>
              <h3 className="font-medium mb-2">Exponents:</h3>
              <LatexRenderer latex="x^2 + y^2 = z^2" displayMode={false} />
            </div>
            <div>
              <h3 className="font-medium mb-2">Greek Letters:</h3>
              <LatexRenderer latex="\alpha + \beta = \gamma" displayMode={false} />
            </div>
            <div>
              <h3 className="font-medium mb-2">Integrals:</h3>
              <LatexRenderer latex="\int_0^1 x^2 dx" displayMode={false} />
            </div>
            <div>
              <h3 className="font-medium mb-2">Summation:</h3>
              <LatexRenderer latex="\sum_{i=1}^n i = \frac{n(n+1)}{2}" displayMode={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
