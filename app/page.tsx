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
	console.log('=== CHAT PAGE: Component rendering ===');
	
	const router = useRouter();
	
	// Create a consistent session ID
	const defaultSessionId = Date.now().toString();
	
	// Initialize with a default session immediately
	const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
		const defaultSession: ChatSession = {
			id: defaultSessionId,
			title: 'New Chat',
			messages: [{ role: 'assistant', content: 'Hi! I can help with GCSE Maths using Mentara. Ask a question or upload an image and tell me about it.' }],
			timestamp: new Date()
		};
		console.log('=== CHAT PAGE: IMMEDIATE session creation in useState ===', defaultSession);
		return [defaultSession];
	});
	
	const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
		console.log('=== CHAT PAGE: IMMEDIATE currentSessionId set ===', defaultSessionId);
		return defaultSessionId;
	});
	const [isInitialized, setIsInitialized] = useState(false);
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
		
		console.log('=== CHAT PAGE: Creating new chat session... ===');
		setIsCreatingSession(true);
		const newSession: ChatSession = {
			id: Date.now().toString(),
			title: 'New Chat',
			messages: [{ role: 'assistant', content: 'Hi! I can help with GCSE Maths using Mentara. Ask a question or upload an image and tell me about it.' }],
			timestamp: new Date()
		};
		console.log('=== CHAT PAGE: New session created:', newSession);
		setChatSessions(prev => {
			const updated = [newSession, ...prev];
			console.log('=== CHAT PAGE: Updated chat sessions:', updated);
			
			// DIRECT localStorage save - save immediately after creating new session
			console.log('=== CHAT PAGE: DIRECT localStorage save in createNewChat ===');
			try {
				localStorage.setItem('chatSessions', JSON.stringify(updated));
				console.log('=== CHAT PAGE: DIRECT localStorage save for new session successful ===');
			} catch (error) {
				console.error('=== CHAT PAGE: DIRECT localStorage save for new session failed ===', error);
			}
			
			return updated;
		});
		setCurrentSessionId(newSession.id);
		setIsInitialized(true);
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
		
		// Ensure we have a session before sending
		if (!currentSessionId || chatSessions.length === 0) {
			if (isCreatingSession) return; // Don't create multiple sessions
			console.log('=== CHAT PAGE: No session available, creating new session before sending ===');
			createNewChat();
			// Wait for the session to be created, then send the message
			setTimeout(() => {
				// Now send the message with the new session
				sendMessage(text);
			}, 200);
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
			
			// DIRECT localStorage save - save immediately after updating
			console.log('=== CHAT PAGE: DIRECT localStorage save in sendMessage ===');
			try {
				localStorage.setItem('chatSessions', JSON.stringify(updated));
				console.log('=== CHAT PAGE: DIRECT localStorage save successful ===');
			} catch (error) {
				console.error('=== CHAT PAGE: DIRECT localStorage save failed ===', error);
			}
			
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
				
				// DIRECT localStorage save - save immediately after updating with assistant reply
				console.log('=== CHAT PAGE: DIRECT localStorage save with assistant reply ===');
				try {
					localStorage.setItem('chatSessions', JSON.stringify(updated));
					console.log('=== CHAT PAGE: DIRECT localStorage save with reply successful ===');
				} catch (error) {
					console.error('=== CHAT PAGE: DIRECT localStorage save with reply failed ===', error);
				}
				
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
				
				// DIRECT localStorage save - save immediately after error message
				console.log('=== CHAT PAGE: DIRECT localStorage save with error message ===');
				try {
					localStorage.setItem('chatSessions', JSON.stringify(updated));
					console.log('=== CHAT PAGE: DIRECT localStorage save with error successful ===');
				} catch (error) {
					console.error('=== CHAT PAGE: DIRECT localStorage save with error failed ===', error);
				}
				
				return updated;
			});
		} finally {
			setIsSending(false);
		}
	};

	// Save chat sessions to localStorage (combined effect)
	useEffect(() => {
		console.log('=== CHAT PAGE: localStorage save effect triggered ===');
		console.log('=== CHAT PAGE: chatSessions.length ===', chatSessions.length);
		console.log('=== CHAT PAGE: typeof window ===', typeof window);
		console.log('=== CHAT PAGE: chatSessions value ===', chatSessions);
		
		if (chatSessions.length > 0 && typeof window !== 'undefined') {
			console.log('=== CHAT PAGE: Saving chat sessions to localStorage ===', chatSessions);
			const jsonString = JSON.stringify(chatSessions);
			console.log('=== CHAT PAGE: JSON string to save ===', jsonString);
			
			try {
				localStorage.setItem('chatSessions', jsonString);
				console.log('=== CHAT PAGE: localStorage save successful ===');
				
				// Test if it was saved
				const saved = localStorage.getItem('chatSessions');
				console.log('=== CHAT PAGE: Verification - localStorage now contains ===', saved);
				
				// Check if the save was successful
				if (saved === jsonString) {
					console.log('=== CHAT PAGE: localStorage save verification successful ===');
				} else {
					console.error('=== CHAT PAGE: localStorage save verification failed - mismatch ===');
				}
			} catch (error) {
				console.error('=== CHAT PAGE: localStorage save failed ===', error);
			}
		} else {
			console.log('=== CHAT PAGE: Conditions not met for localStorage save ===');
			console.log('=== CHAT PAGE: chatSessions.length > 0:', chatSessions.length > 0);
			console.log('=== CHAT PAGE: typeof window !== undefined:', typeof window !== 'undefined');
		}
	}, [chatSessions]); // Depend on chatSessions - runs when it's first populated

	// Test useEffect - this should ALWAYS run
	useEffect(() => {
		console.log('=== CHAT PAGE: TEST useEffect - this should always run ===');
		console.log('=== CHAT PAGE: Component mounted/updated ===');
	}, []); // Empty dependency array - runs on every render

	// Simple test - no useEffect
	console.log('=== CHAT PAGE: Direct console log test ===');

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
		if (isInitialized) return; // Prevent multiple initializations
		
		console.log('=== CHAT PAGE: Loading chat sessions from localStorage ===');
		
		// FORCE session creation for debugging
		console.log('=== CHAT PAGE: FORCING session creation for debugging ===');
		initializeDefaultSession();
	}, [isInitialized]);

	// Initialize default session
	const initializeDefaultSession = () => {
		console.log('=== CHAT PAGE: initializeDefaultSession called ===');
		const defaultSession: ChatSession = {
			id: Date.now().toString(),
			title: 'New Chat',
			messages: [{ role: 'assistant', content: 'Hi! I can help with GCSE Maths using Mentara. Ask a question or upload an image and tell me about it.' }],
			timestamp: new Date()
		};
		console.log('=== CHAT PAGE: Created default session:', defaultSession);
		setChatSessions([defaultSession]);
		setCurrentSessionId(defaultSession.id);
		setIsInitialized(true);
		console.log('=== CHAT PAGE: Default session set, currentSessionId:', defaultSession.id);
	};

	console.log('=== CHAT PAGE: About to return JSX ===');
	
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
