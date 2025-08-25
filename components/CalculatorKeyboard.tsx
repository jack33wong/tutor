'use client';

import React from 'react';

interface CalculatorKeyboardProps {
	onInsert: (text: string) => void;
	onDelete?: () => void;
	onClear?: () => void;
}

/**
 * Lightweight on-screen scientific calculator keyboard.
 * Emits plain-text tokens that can be inserted into an input/textarea.
 */
export default function CalculatorKeyboard({ onInsert, onDelete, onClear }: CalculatorKeyboardProps) {
	const handle = (token: string) => () => onInsert(token);

	return (
		<div className="mt-4 p-3 bg-white border border-gray-200 rounded-xl shadow-sm select-none">
			<div className="grid grid-cols-5 gap-2">
				{/* Row 1 */}
				<button type="button" className="px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" onClick={() => onClear?.()}>AC</button>
				<button type="button" className="px-3 py-2 rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100" onClick={() => onDelete?.()}>DEL</button>
				<button type="button" className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={handle('(')}>(</button>
				<button type="button" className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={handle(')')}>)</button>
				<button type="button" className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={handle('^')}>^</button>

				{/* Row 2 */}
				<button type="button" className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 col-span-1" onClick={handle('sqrt(')}>√</button>
				<button type="button" className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={handle('^2')}>x²</button>
				<button type="button" className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={handle('pi')}>π</button>
				<button type="button" className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={handle('e')}>e</button>
				<button type="button" className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={handle('%')}>%</button>

				{/* Row 3 */}
				<button type="button" className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={handle('7')}>7</button>
				<button type="button" className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={handle('8')}>8</button>
				<button type="button" className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={handle('9')}>9</button>
				<button type="button" className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={handle('/')}>÷</button>
				<button type="button" className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={handle('sin(')}>sin</button>

				{/* Row 4 */}
				<button type="button" className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={handle('4')}>4</button>
				<button type="button" className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={handle('5')}>5</button>
				<button type="button" className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={handle('6')}>6</button>
				<button type="button" className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={handle('*')}>×</button>
				<button type="button" className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={handle('cos(')}>cos</button>

				{/* Row 5 */}
				<button type="button" className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={handle('1')}>1</button>
				<button type="button" className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={handle('2')}>2</button>
				<button type="button" className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={handle('3')}>3</button>
				<button type="button" className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={handle('-')}>−</button>
				<button type="button" className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={handle('tan(')}>tan</button>

				{/* Row 6 */}
				<button type="button" className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 col-span-2" onClick={handle('0')}>0</button>
				<button type="button" className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={handle('.')}>.</button>
				<button type="button" className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={handle('+')}>+</button>
				<button type="button" className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={handle('ln(')}>ln</button>
			</div>
		</div>
	);
}




