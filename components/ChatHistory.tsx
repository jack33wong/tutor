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
	console.log('=== CHAT HISTORY: Component rendering ===');
	
	const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
	const [isMounted, setIsMounted] = useState(false);
	const [debugInfo, setDebugInfo] = useState('Component created');
	const router = useRouter();

	// Simple function to load chat sessions
	const loadChatSessions = () => {
		if (typeof window === 'undefined') return;
		
		try {
			console.log('=== CHAT HISTORY: loadChatSessions called ===');
			
			// Test localStorage
			localStorage.setItem('test', 'test-value');
			const testValue = localStorage.getItem('test');
			console.log('=== CHAT HISTORY: localStorage test ===', testValue);
			
			// Check all localStorage keys
			const allKeys = [];
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key) allKeys.push(key);
			}
			console.log('=== CHAT HISTORY: All localStorage keys ===', allKeys);
			
			const saved = localStorage.getItem('chatSessions');
			console.log('=== CHAT HISTORY: localStorage.getItem("chatSessions") ===', saved);
			
			if (saved && saved.trim() !== '' && saved !== 'null') {
				try {
					const parsed = JSON.parse(saved);
					console.log('=== CHAT HISTORY: Parsed sessions ===', parsed);
					setChatSessions(parsed);
				} catch (parseError) {
					console.error('=== CHAT HISTORY: Parse error ===', parseError);
					setChatSessions([]);
				}
			} else {
				console.log('=== CHAT HISTORY: No valid chatSessions found ===');
				setChatSessions([]);
			}
		} catch (error) {
			console.error('=== CHAT HISTORY: Error loading chat sessions ===', error);
		}
	};

	// Mount effect - only run on client side
	useEffect(() => {
		console.log('=== CHAT HISTORY: useEffect running ===');
		setDebugInfo('useEffect started');
		setIsMounted(true);
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

	// Don't render anything until mounted to prevent hydration mismatch
	if (!isMounted) {
		return (
			<div className="mb-6 border-4 border-yellow-500 p-4 bg-yellow-50">
				<h3 className="text-sm font-medium text-gray-700 mb-3">Loading Chat History...</h3>
				<div className="text-xs text-gray-500 mb-2">Debug: {debugInfo}</div>
				<div className="animate-pulse space-y-2">
					<div className="h-4 bg-yellow-200 rounded"></div>
					<div className="h-4 bg-yellow-200 rounded w-3/4"></div>
				</div>
			</div>
		);
	}

	// Simple render - always show something
	return (
		<div className="mb-6 border-4 border-green-500 p-4 bg-green-50">
			<h3 className="text-sm font-medium text-gray-700 mb-3">Recent Chats (MOUNTED)</h3>
			
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
