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
					<div className="mb-6 border-4 border-yellow-500 p-4 bg-yellow-50">
			<h3 className="text-sm font-medium text-gray-700 mb-3">Loading Chat History...</h3>
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
			<h3 className="text-sm font-medium text-gray-700 mb-3">Recent Chats</h3>
			

			
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
