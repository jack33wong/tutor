'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Clock } from 'lucide-react';

type ChatItem = { role: 'user' | 'assistant'; content: string };

interface ChatSession {
	id: string;
	title: string;
	messages: ChatItem[];
	timestamp: Date | string;
}

export default function ChatHistory() {
	const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		// Mark as client-side rendered
		setIsClient(true);
		
		// Load chat sessions from localStorage
		try {
			const savedSessions = localStorage.getItem('chatSessions');
			
			if (savedSessions) {
				const parsed = JSON.parse(savedSessions);
				
				// Convert timestamp strings back to Date objects if needed
				const sessionsWithDates = parsed.map((session: any) => ({
					...session,
					timestamp: typeof session.timestamp === 'string' ? new Date(session.timestamp) : session.timestamp
				}));
				
				setChatSessions(sessionsWithDates);
			}
		} catch (error) {
			console.error('ChatHistory: Error loading chat sessions:', error);
		}
	}, []);

	const formatTime = (timestamp: Date | string) => {
		const now = new Date();
		const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
		const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

		if (diffInHours < 1) {
			return 'Just now';
		} else if (diffInHours < 24) {
			return `${Math.floor(diffInHours)}h ago`;
		} else {
			return date.toLocaleDateString('en-GB', { 
				day: 'numeric', 
				month: 'short' 
			});
		}
	};

	const handleChatClick = (sessionId: string) => {
		// Navigate to chat page and switch to the selected session
		if (typeof window !== 'undefined') {
			// Store the session ID to restore when the chat page loads
			localStorage.setItem('restoreSessionId', sessionId);
			window.location.href = '/';
		}
	};

	// Don't render anything during server-side rendering
	if (!isClient) {
		return (
			<div className="mb-6">
				<h3 className="text-sm font-medium text-gray-700 mb-3">Recent Chats</h3>
				<div className="space-y-2">
					<div className="p-2 rounded-lg bg-gray-100 animate-pulse">
						<div className="h-4 bg-gray-200 rounded mb-1"></div>
						<div className="h-3 bg-gray-200 rounded w-16"></div>
					</div>
					<div className="p-2 rounded-lg bg-gray-100 animate-pulse">
						<div className="h-4 bg-gray-200 rounded mb-1"></div>
						<div className="h-3 bg-gray-200 rounded w-20"></div>
					</div>
				</div>
			</div>
		);
	}

	if (chatSessions.length === 0) {
		return (
			<div className="mb-6">
				<h3 className="text-sm font-medium text-gray-700 mb-3">Recent Chats</h3>
				<div className="text-center py-4">
					<MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
					<p className="text-sm text-gray-500">No chat history yet</p>
					<p className="text-xs text-gray-400">Start a new chat to begin</p>
				</div>
			</div>
		);
	}

	return (
		<div className="mb-6">
			<h3 className="text-sm font-medium text-gray-700 mb-3">Recent Chats</h3>
			<div className="space-y-2">
				{chatSessions
					.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
					.slice(0, 5)
					.map((session) => (
					<div
						key={session.id}
						className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors duration-200"
						onClick={() => handleChatClick(session.id)}
					>
						<div className="text-sm text-gray-600 truncate mb-1">
							{session.title || 'New Chat'}
						</div>
						<div className="flex items-center justify-between text-xs text-gray-400">
							<div className="flex items-center">
								<Clock className="w-3 h-3 mr-1" />
								{formatTime(session.timestamp)}
							</div>
							<span className="text-xs text-gray-400">
								{session.messages.length} message{session.messages.length !== 1 ? 's' : ''}
							</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
