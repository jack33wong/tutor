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

interface ChatHistoryProps {
	chatSessions: ChatSession[];
}

export default function ChatHistory({ chatSessions }: ChatHistoryProps) {
	const [isMounted, setIsMounted] = useState(false);
	const router = useRouter();



	// Mount effect - only run on client side
	useEffect(() => {
		setIsMounted(true);
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
			<div className="mb-4 p-3 bg-gray-50 rounded-lg">
				<div className="flex items-center space-x-2">
					<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
					<span className="text-sm text-gray-500">Loading...</span>
				</div>
			</div>
		);
	}

	// Clean, professional render
	return (
		<div className="mb-4">
			<h3 className="text-sm font-medium text-gray-700 mb-3 px-1">Recent Chats</h3>
			
			{/* Chat sessions */}
			{chatSessions.length === 0 ? (
				<div className="text-center py-6">
					<MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
					<p className="text-sm text-gray-500">No chat history yet</p>
					<p className="text-xs text-gray-400">Start a new chat to begin</p>
				</div>
			) : (
				<div className="space-y-1">
					{chatSessions.slice(0, 5).map((session) => (
						<div
							key={session.id}
							className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200 border border-gray-200 hover:border-gray-300"
							onClick={() => handleChatClick(session.id)}
						>
							<div className="text-sm font-medium text-gray-700 truncate mb-1">
								{session.title || 'New Chat'}
							</div>
							<div className="text-xs text-gray-500">
								{session.messages.length} message{session.messages.length !== 1 ? 's' : ''}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
