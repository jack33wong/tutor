'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ChatItem = { role: 'user' | 'assistant'; content: string };

interface ChatSession {
	id: string;
	title: string;
	messages: ChatItem[];
	timestamp: Date | string;
}

export default function ChatHistory() {
	const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
	const router = useRouter();

	// Simple function to load chat sessions
	const loadChatSessions = () => {
		if (typeof window === 'undefined') return;
		
		try {
			// Test localStorage
			localStorage.setItem('test', 'test-value');
			const testValue = localStorage.getItem('test');
			console.log('localStorage test:', testValue);
			
			const saved = localStorage.getItem('chatSessions');
			console.log('ChatHistory: localStorage.getItem("chatSessions"):', saved);
			
			if (saved) {
				const parsed = JSON.parse(saved);
				console.log('ChatHistory: Parsed sessions:', parsed);
				setChatSessions(parsed);
			} else {
				console.log('ChatHistory: No chatSessions found in localStorage');
				setChatSessions([]);
			}
		} catch (error) {
			console.error('Error loading chat sessions:', error);
		}
	};

	// Load on mount
	useEffect(() => {
		loadChatSessions();
		
		// Refresh every 3 seconds
		const interval = setInterval(loadChatSessions, 3000);
		return () => clearInterval(interval);
	}, []);

	const handleChatClick = (sessionId: string) => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('restoreSessionId', sessionId);
			router.push('/');
		}
	};

	// Simple render - always show something
	return (
		<div className="mb-6 border-4 border-green-500 p-4 bg-green-50">
			<h3 className="text-sm font-medium text-gray-700 mb-3">Recent Chats (SIMPLE)</h3>
			
			{/* Debug info */}
			<div className="text-xs text-gray-600 p-2 bg-white rounded mb-3">
				Found {chatSessions.length} chat sessions
			</div>
			
			{/* Refresh button */}
			<button
				onClick={loadChatSessions}
				className="w-full p-2 bg-green-500 text-white text-xs rounded hover:bg-green-600 mb-3"
			>
				🔄 Refresh
			</button>
			
			{/* Test button */}
			<button
				onClick={() => {
					const testSession = {
						id: 'test-' + Date.now(),
						title: 'Test Chat',
						messages: [{ role: 'assistant', content: 'This is a test message' }],
						timestamp: new Date()
					};
					localStorage.setItem('chatSessions', JSON.stringify([testSession]));
					console.log('Created test session:', testSession);
					loadChatSessions();
				}}
				className="w-full p-2 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 mb-3"
			>
				🧪 Create Test Session
			</button>
			
			{/* Chat sessions */}
			{chatSessions.length === 0 ? (
				<div className="text-center py-4">
					<MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
					<p className="text-sm text-gray-500">No chat history yet</p>
					<p className="text-xs text-gray-400">Start a new chat to begin</p>
				</div>
			) : (
				<div className="space-y-2">
					{chatSessions.slice(0, 5).map((session) => (
						<div
							key={session.id}
							className="p-2 rounded-lg hover:bg-green-100 cursor-pointer transition-colors duration-200 border border-green-200"
							onClick={() => handleChatClick(session.id)}
						>
							<div className="text-sm text-gray-600 truncate mb-1">
								{session.title || 'New Chat'}
							</div>
							<div className="text-xs text-gray-400">
								{session.messages.length} message{session.messages.length !== 1 ? 's' : ''}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
