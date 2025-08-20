'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Clock } from 'lucide-react';

interface ChatSession {
	id: string;
	title: string;
	timestamp: number;
	lastUpdated: number;
}

export default function ChatHistory() {
	const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

	useEffect(() => {
		// Load chat sessions from localStorage
		const savedSessions = localStorage.getItem('chatSessions');
		if (savedSessions) {
			try {
				setChatSessions(JSON.parse(savedSessions));
			} catch (error) {
				console.error('Error parsing chat sessions:', error);
			}
		}
	}, []);

	const formatTime = (timestamp: number) => {
		const now = new Date();
		const date = new Date(timestamp);
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

	if (chatSessions.length === 0) {
		return (
			<div className="text-center py-4">
				<MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
				<p className="text-sm text-gray-500">No chat history yet</p>
				<p className="text-xs text-gray-400">Start a new chat to begin</p>
			</div>
		);
	}

	return (
		<div className="mb-6">
			<h3 className="text-sm font-medium text-gray-700 mb-3">Recent Chats</h3>
			<div className="space-y-2">
				{chatSessions.slice(0, 5).map((session) => (
					<div
						key={session.id}
						className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors duration-200"
						onClick={() => window.location.href = '/'}
					>
						<div className="text-sm text-gray-600 truncate mb-1">
							{session.title || 'New Chat'}
						</div>
						<div className="flex items-center text-xs text-gray-400">
							<Clock className="w-3 h-3 mr-1" />
							{formatTime(session.lastUpdated)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
