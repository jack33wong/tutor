"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, ImageIcon, Pencil, Plus, MessageCircle, LayoutDashboard, FileText } from 'lucide-react';
import DrawingPad from '@/components/DrawingPad';
import MarkdownMessage from '@/components/MarkdownMessage';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LeftSidebar from '@/components/LeftSidebar';

type ChatItem = { role: 'user' | 'assistant'; content: string };
type ChatSession = {
	id: string;
	title: string;
	messages: ChatItem[];
	timestamp: Date;
};

export default function ChatHome() {
	const router = useRouter();
	const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
	const [currentSessionId, setCurrentSessionId] = useState<string>('');
	const [input, setInput] = useState('');
	const [uploadName, setUploadName] = useState<string | null>(null);
	const [showNotepad, setShowNotepad] = useState(false);
	const [isSending, setIsSending] = useState(false);
	const [isCreatingSession, setIsCreatingSession] = useState(false);
	const fileRef = useRef<HTMLInputElement | null>(null);

	// Get current session
	const currentSession = chatSessions.find(session => session.id === currentSessionId);
	const messages = currentSession?.messages || [];

	// Create new chat session
	const createNewChat = () => {
		if (isCreatingSession) return; // Prevent multiple simultaneous creations
		
		setIsCreatingSession(true);
		const newSession: ChatSession = {
			id: Date.now().toString(),
			title: 'New Chat',
			messages: [{ role: 'assistant', content: 'Hi! I can help with GCSE Maths using Mentara. Ask a question or upload an image and tell me about it.' }],
			timestamp: new Date()
		};
		setChatSessions(prev => [newSession, ...prev]);
		setCurrentSessionId(newSession.id);
		setInput('');
		setUploadName(null);
		
		// Reset the flag after a short delay
		setTimeout(() => setIsCreatingSession(false), 200);
	};

	// Switch to a different chat session
	const switchToSession = (sessionId: string) => {
		setCurrentSessionId(sessionId);
		setInput('');
		setUploadName(null);
	};

	// Delete a chat session
	const deleteSession = (sessionId: string) => {
		if (chatSessions.length === 1) return; // Don't delete the last session
		setChatSessions(prev => prev.filter(session => session.id !== sessionId));
		if (currentSessionId === sessionId) {
			const remainingSessions = chatSessions.filter(session => session.id !== sessionId);
			setCurrentSessionId(remainingSessions[0].id);
		}
	};

	// Update session title based on first user message
	const updateSessionTitle = (sessionId: string, firstUserMessage: string) => {
		setChatSessions(prev => prev.map(session => 
			session.id === sessionId 
				? { ...session, title: firstUserMessage.slice(0, 30) + (firstUserMessage.length > 30 ? '...' : '') }
				: session
		));
	};

	const send = async () => {
		const text = input.trim();
		if (!text) {
			return;
		}
		
		// If no current session, create one first
		if (!currentSessionId) {
			if (isCreatingSession) return; // Don't create multiple sessions
			createNewChat();
			// Wait for the session to be created, then send the message
			setTimeout(() => {
				// Now send the message with the new session
				sendMessage(text);
			}, 100);
			return;
		}
		
		// Send the message with existing session
		sendMessage(text);
	};

	// Separate function to actually send the message
	const sendMessage = async (text: string) => {
		if (!currentSessionId) return;
		
		setIsSending(true);
		const userMsg: ChatItem = { role: 'user', content: text + (uploadName ? `\n(Attached: ${uploadName})` : '') };
		
		// Update messages in current session
		setChatSessions(prev => {
			const updated = prev.map(session => 
				session.id === currentSessionId 
					? { ...session, messages: [...session.messages, userMsg] }
					: session
			);
			return updated;
		});

		// Update session title if this is the first user message
		if (currentSession && currentSession.messages.length === 1) {
			updateSessionTitle(currentSessionId, text);
		}

		setInput('');
		try {
			const resp = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: text, imageName: uploadName || undefined }),
			});
			const data = await resp.json();
			const reply = data?.reply || 'Sorry, I could not respond right now.';
			
			// Add assistant reply to current session
			setChatSessions(prev => {
				const updated = prev.map(session => 
					session.id === currentSessionId 
						? { ...session, messages: [...session.messages, { role: 'assistant' as const, content: reply }] }
						: session
				);
				return updated;
			});
		} catch (e) {
			console.error('Error in send function:', e);
			setChatSessions(prev => {
				const updated = prev.map(session => 
					session.id === currentSessionId 
						? { ...session, messages: [...session.messages, { role: 'assistant' as const, content: 'Network error. Please try again.' }] }
						: session
				);
				return updated;
			});
		} finally {
			setIsSending(false);
		}
	};

	// Save chat sessions to localStorage
	useEffect(() => {
		localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
		
		// Dispatch custom event to notify other components that chat sessions have been updated
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('chatSessionsUpdated'));
		}
	}, [chatSessions]);

	// Handle session restoration when currentSessionId changes
	useEffect(() => {
		if (currentSessionId && chatSessions.length > 0) {
			const currentSession = chatSessions.find(session => session.id === currentSessionId);
			if (currentSession) {
				console.log('Current session loaded:', currentSession.id, 'with', currentSession.messages.length, 'messages');
			}
		}
	}, [currentSessionId, chatSessions]);

	// Load chat sessions from localStorage on mount
	useEffect(() => {
		const saved = localStorage.getItem('chatSessions');
		
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				
				// Convert timestamp strings back to Date objects
				const sessionsWithDates = parsed.map((session: any) => ({
					...session,
					timestamp: new Date(session.timestamp)
				}));
				
				// Sort sessions by timestamp (newest first)
				const sortedSessions = sessionsWithDates.sort((a: ChatSession, b: ChatSession) => 
					new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
				);
				
				setChatSessions(sortedSessions);
				
				// Check if we need to restore a specific session (e.g., from dashboard)
				const restoreSessionId = localStorage.getItem('restoreSessionId');
				
				if (restoreSessionId) {
					// Find the session to restore
					const sessionToRestore = sortedSessions.find((session: ChatSession) => session.id === restoreSessionId);
					
					if (sessionToRestore) {
						console.log('Restoring session:', restoreSessionId, 'with', sessionToRestore.messages.length, 'messages');
						setCurrentSessionId(restoreSessionId);
					} else {
						console.log('Session not found, using first session');
						setCurrentSessionId(sortedSessions[0]?.id || '');
					}
					// Clear the restore flag
					localStorage.removeItem('restoreSessionId');
				} else {
					// Set the first session as current if no restore needed
					console.log('No restore needed, using first session:', sortedSessions[0]?.id);
					setCurrentSessionId(sortedSessions[0]?.id || '');
				}
			} catch (e) {
				console.error('Error loading chat sessions:', e);
				// If there's an error, initialize with default session
				initializeDefaultSession();
			}
		} else {
			// No saved sessions, initialize with default
			initializeDefaultSession();
		}
	}, []);

	// Initialize default session
	const initializeDefaultSession = () => {
		const defaultSession: ChatSession = {
			id: Date.now().toString(),
			title: 'New Chat',
			messages: [{ role: 'assistant', content: 'Hi! I can help with GCSE Maths using Mentara. Ask a question or upload an image and tell me about it.' }],
			timestamp: new Date()
		};
		setChatSessions([defaultSession]);
		setCurrentSessionId(defaultSession.id);
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="flex h-screen">
				{/* Left Sidebar */}
				<LeftSidebar onNewChat={createNewChat}>
					{/* Chat History */}
					<div className="flex-1 overflow-y-auto">
						{chatSessions.map((session, index) => (
							<div key={session.id} className="mb-2">
								<button
									onClick={() => switchToSession(session.id)}
									className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${
										currentSessionId === session.id
											? 'bg-gray-100 text-gray-800'
											: 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
									}`}
								>
									<div className="truncate">{session.title}</div>
									<div className="text-xs text-gray-400 mt-1">
										{new Date(session.timestamp).toLocaleDateString('en-GB')}
									</div>
								</button>
								{currentSessionId === session.id && (
									<div className="flex space-x-1 mt-1 px-3">
										<button
											onClick={() => updateSessionTitle(session.id, session.messages.find(m => m.role === 'user')?.content || 'New Chat')}
											className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
										>
											Edit
										</button>
										<button
											onClick={() => deleteSession(session.id)}
											className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
										>
											Delete
										</button>
									</div>
								)}
							</div>
						))}
					</div>
				</LeftSidebar>

				{/* Chat Area */}
				<main className="flex-1 flex flex-col">
					{/* Chat Messages */}
					<div className="flex-1 overflow-y-auto p-4">
						<div className="max-w-4xl mx-auto space-y-6">
							{messages.length === 0 ? (
								<div className="text-center py-12">
									<div className="text-gray-400 mb-4">
										<MessageCircle className="w-16 h-16 mx-auto" />
									</div>
									<h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Mentara!</h3>
									<p className="text-gray-600">Start a conversation by typing a message below.</p>
								</div>
							) : (
								messages.map((message, index) => (
									<div key={index} className={`mb-6 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
										<div className={`inline-block max-w-3xl ${message.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
											<div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
												message.role === 'user' 
													? 'bg-primary-600 text-white' 
													: 'bg-white border border-gray-200 text-gray-900 shadow-sm'
											}`}>
												{message.role === 'user' ? (
													<div className="whitespace-pre-wrap">{message.content}</div>
												) : (
													<MarkdownMessage content={message.content} />
												)}
											</div>
										</div>
									</div>
								))
							)}
						</div>
					</div>

					{/* Input Bar */}
					<div className="border-t border-gray-200 bg-white p-6">
						<div className="max-w-4xl mx-auto">
							{/* Session status indicator */}
							{(!currentSessionId || isCreatingSession) && (
								<div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
									<div className="flex items-center text-yellow-800">
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
										<span className="text-sm">
											{isCreatingSession ? 'Creating new chat session...' : 'Initializing chat session...'}
										</span>
									</div>
								</div>
							)}
							
							<div className="relative">
								{/* Image attachment button on the left */}
								<button
									onClick={() => fileRef.current?.click()}
									className="absolute left-3 top-1/2 transform -translate-y-1/2 p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-all duration-200"
									title="Attach image"
								>
									<ImageIcon className="w-5 h-5" />
								</button>
								<input
									ref={fileRef}
									type="file"
									accept="image/*"
									className="hidden"
									onChange={(e) => {
										const file = e.target.files?.[0];
										if (file) {
											setUploadName(file.name);
										}
									}}
								/>
								{/* Textarea with integrated buttons */}
								<textarea
									value={input}
									onChange={(e) => setInput(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter' && !e.shiftKey) {
											e.preventDefault();
											send();
										}
									}}
									rows={1}
									placeholder="Ask questions, attach an image (optional), and jot notes in the notepad"
									className="w-full px-12 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none bg-white"
								/>
								{/* Notepad button to the left of send button */}
								<button
									onClick={() => setShowNotepad(v => !v)}
									className="absolute right-16 top-1/2 transform -translate-y-1/2 p-3 rounded-xl hover:bg-gray-100 text-gray-600 transition-all duration-200"
									title={showNotepad ? 'Hide Notepad' : 'Open Notepad'}
								>
									<Pencil className="w-5 h-5" />
								</button>
								{/* Send button on the right */}
								<button
									onClick={send}
									disabled={isSending || !input.trim() || !currentSessionId || isCreatingSession}
									className="absolute right-3 top-1/2 transform -translate-y-1/2 p-4 rounded-2xl bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white shadow-sm hover:shadow-md transition-all duration-200"
									title={!currentSessionId ? 'No active session' : isSending ? 'Sending...' : isCreatingSession ? 'Creating session...' : !input.trim() ? 'Type a message' : 'Send message'}
								>
									<Send className="w-5 h-5" />
								</button>
							</div>
							
							{/* Upload name display */}
							{uploadName && (
								<div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
									<ImageIcon className="w-4 h-4" />
									<span>{uploadName}</span>
									<button
										onClick={() => setUploadName(null)}
										className="text-red-500 hover:text-red-700"
									>
										×
									</button>
								</div>
							)}
						</div>
					</div>
					
					{/* Notepad Display Area */}
					{showNotepad && (
						<div className="mt-4">
							<div className="h-56 border border-gray-300 rounded-lg overflow-hidden">
								<DrawingPad className="h-full w-full" />
							</div>
						</div>
					)}
				</main>
			</div>
		</div>
	);
}
