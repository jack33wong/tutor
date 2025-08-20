'use client';

import { useState, useEffect } from 'react';

export default function DebugStorage() {
	const [storageData, setStorageData] = useState<string>('Loading...');
	const [allKeys, setAllKeys] = useState<string[]>([]);

	useEffect(() => {
		// Check all localStorage contents
		const keys = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key) keys.push(key);
		}
		setAllKeys(keys);

		// Get specific data
		const chatSessions = localStorage.getItem('chatSessions');
		const restoreSessionId = localStorage.getItem('restoreSessionId');
		const test = localStorage.getItem('test');

		setStorageData(`
			chatSessions: ${chatSessions}
			restoreSessionId: ${restoreSessionId}
			test: ${test}
			All keys: ${keys.join(', ')}
		`);
	}, []);

	const createTestSession = () => {
		const testSession = {
			id: 'debug-' + Date.now(),
			title: 'Debug Test Chat',
			messages: [{ role: 'assistant', content: 'This is a debug test message' }],
			timestamp: new Date()
		};
		
		localStorage.setItem('chatSessions', JSON.stringify([testSession]));
		
		// Refresh data
		const chatSessions = localStorage.getItem('chatSessions');
		setStorageData(`After creating test session: ${chatSessions}`);
	};

	const clearStorage = () => {
		localStorage.clear();
		setStorageData('Storage cleared');
		setAllKeys([]);
	};

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-3xl font-bold mb-8">localStorage Debug Page</h1>
				
				<div className="bg-white p-6 rounded-lg shadow mb-6">
					<h2 className="text-xl font-semibold mb-4">localStorage Contents</h2>
					<pre className="text-sm bg-gray-100 p-4 rounded whitespace-pre-wrap">
						{storageData}
					</pre>
				</div>

				<div className="bg-white p-6 rounded-lg shadow mb-6">
					<h2 className="text-xl font-semibold mb-4">Actions</h2>
					<div className="space-x-4">
						<button
							onClick={createTestSession}
							className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
						>
							Create Test Session
						</button>
						<button
							onClick={clearStorage}
							className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
						>
							Clear Storage
						</button>
						<button
							onClick={() => window.location.reload()}
							className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
						>
							Reload Page
						</button>
					</div>
				</div>

				<div className="bg-white p-6 rounded-lg shadow">
					<h2 className="text-xl font-semibold mb-4">All localStorage Keys</h2>
					{allKeys.length === 0 ? (
						<p className="text-gray-500">No keys found in localStorage</p>
					) : (
						<ul className="list-disc pl-6">
							{allKeys.map((key, index) => (
								<li key={index} className="text-sm">
									<strong>{key}</strong>: {localStorage.getItem(key)?.substring(0, 100)}...
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</div>
	);
}
