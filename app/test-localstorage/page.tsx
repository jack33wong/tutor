'use client';

import { useState, useEffect } from 'react';

export default function TestLocalStorage() {
	const [localStorageStatus, setLocalStorageStatus] = useState<string>('Testing...');
	const [chatSessions, setChatSessions] = useState<any[]>([]);

	useEffect(() => {
		// Test localStorage
		try {
			// Test basic localStorage
			localStorage.setItem('test', 'test-value');
			const testValue = localStorage.getItem('test');
			
			if (testValue === 'test-value') {
				setLocalStorageStatus('localStorage is working');
				
				// Check for chatSessions
				const saved = localStorage.getItem('chatSessions');
				if (saved) {
					try {
						const parsed = JSON.parse(saved);
						setChatSessions(parsed);
						setLocalStorageStatus(`localStorage is working. Found ${parsed.length} chat sessions`);
					} catch (e) {
						setLocalStorageStatus(`localStorage is working but chatSessions is invalid JSON: ${e}`);
					}
				} else {
					setLocalStorageStatus('localStorage is working but no chatSessions found');
				}
			} else {
				setLocalStorageStatus('localStorage test failed');
			}
		} catch (error) {
			setLocalStorageStatus(`localStorage error: ${error}`);
		}
	}, []);

	const createTestSession = () => {
		const testSession = {
			id: 'test-' + Date.now(),
			title: 'Test Chat',
			messages: [{ role: 'assistant', content: 'This is a test message' }],
			timestamp: new Date()
		};
		
		localStorage.setItem('chatSessions', JSON.stringify([testSession]));
		setChatSessions([testSession]);
		setLocalStorageStatus('Test session created');
	};

	const clearAll = () => {
		localStorage.clear();
		setChatSessions([]);
		setLocalStorageStatus('localStorage cleared');
	};

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-3xl font-bold mb-8">localStorage Test Page</h1>
				
				<div className="bg-white p-6 rounded-lg shadow mb-6">
					<h2 className="text-xl font-semibold mb-4">Status</h2>
					<p className="text-lg">{localStorageStatus}</p>
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
							onClick={clearAll}
							className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
						>
							Clear All
						</button>
					</div>
				</div>

				<div className="bg-white p-6 rounded-lg shadow">
					<h2 className="text-xl font-semibold mb-4">Current Chat Sessions</h2>
					{chatSessions.length === 0 ? (
						<p className="text-gray-500">No chat sessions found</p>
					) : (
						<div className="space-y-2">
							{chatSessions.map((session, index) => (
								<div key={session.id} className="p-3 border rounded">
									<div className="font-medium">{session.title}</div>
									<div className="text-sm text-gray-600">ID: {session.id}</div>
									<div className="text-sm text-gray-600">{session.messages.length} messages</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
