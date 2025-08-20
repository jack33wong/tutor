"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
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

	// Custom hook for localStorage persistence - HYDRATION SAFE
	function useLocalStorage<T>(key: string, initialValue: T) {
		const [storedValue, setStoredValue] = useState<T>(initialValue);
		const [isHydrated, setIsHydrated] = useState(false);

		// Hydrate from localStorage after component mounts (client-side only)
		useEffect(() => {
			if (typeof window !== 'undefined') {
				try {
					const item = window.localStorage.getItem(key);
					if (item) {
						const parsed = JSON.parse(item);
						setStoredValue(parsed);
					}
				} catch (error) {
					console.error(`Error reading localStorage key "${key}":`, error);
				}
				setIsHydrated(true);
			}
		}, [key]);

		const setValue = useCallback((value: T | ((val: T) => T)) => {
			try {
				const valueToStore = value instanceof Function ? value(storedValue) : value;
				setStoredValue(valueToStore);
				
				if (typeof window !== 'undefined' && isHydrated) {
					window.localStorage.setItem(key, JSON.stringify(valueToStore));
				}
			} catch (error) {
				console.error(`Error setting localStorage key "${key}":`, error);
			}
		}, [key, storedValue, isHydrated]);

		return [storedValue, setValue, isHydrated] as const;
	}

export default function ChatHome() {
	
	
	const router = useRouter();
	
	// Create a consistent session ID - use useRef to ensure it's stable across re-renders
	const defaultSessionIdRef = useRef<string>('');
	if (!defaultSessionIdRef.current) {
		defaultSessionIdRef.current = Date.now().toString();
	}
	const defaultSessionId = defaultSessionIdRef.current;
	
	// Initialize with empty array - let the useEffect handle creating default session if needed
	const [chatSessions, setChatSessions, isHydrated] = useLocalStorage<ChatSession[]>('chatSessions', []);
	
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
		
		setIsCreatingSession(true);
		const newSession: ChatSession = {
			id: Date.now().toString(),
			title: 'New Chat',
			messages: [{ role: 'assistant', content: 'Hi! I can help with GCSE Maths using Mentara. Ask a question or upload an image and tell me about it.' }],
			timestamp: new Date()
		};
		setChatSessions(prev => [newSession, ...prev]);
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
		console.log('=== CHAT PAGE: Updating session title ===', { sessionId, firstUserMessage });
		setChatSessions(prev => {
			const updated = prev.map(session => 
				session.id === sessionId 
					? { ...session, title: firstUserMessage.slice(0, 30) + (firstUserMessage.length > 30 ? '...' : ''), timestamp: new Date() }
					: session
			);
			console.log('=== CHAT PAGE: Updated sessions with new title ===', updated);
			return updated;
		});
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
		
		// Store the current session data to ensure we don't lose it
		const currentSession = chatSessions.find(s => s.id === currentSessionId);
		if (!currentSession) {
			setIsSending(false);
			return;
		}

		// Store the title that should be preserved
		const titleToPreserve = currentSession.messages.length === 1 
			? text.slice(0, 30) + (text.length > 30 ? '...' : '')
			: currentSession.title;

		setInput('');
		try {
			const resp = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: text, imageName: uploadName || undefined }),
			});
			const data = await resp.json();
			const reply = data?.reply || 'Sorry, I could not respond right now.';
			

			
			// SINGLE ATOMIC UPDATE: Add both user message and assistant reply in one state update
			setChatSessions(prev => {
				const updated = prev.map(session => {
					if (session.id === currentSessionId) {
						// Create the complete updated session with both messages
						const updatedSession = {
							...session,
							title: titleToPreserve, // Explicitly preserve the title
							messages: [
								...session.messages, 
								userMsg, 
								{ role: 'assistant' as const, content: reply }
							],
							timestamp: new Date()
						};
						

						
						return updatedSession;
					}
					return session;
				});
				

				return updated;
			});
		} catch (e) {
			console.error('Error in send function:', e);
			// Error case: Add both user message and error message in one update
			setChatSessions(prev => {
				const updated = prev.map(session => {
					if (session.id === currentSessionId) {
						const updatedSession = {
							...session,
							title: titleToPreserve, // Preserve the title
							messages: [
								...session.messages, 
								userMsg, 
								{ role: 'assistant' as const, content: 'Network error. Please try again.' }
							],
							timestamp: new Date()
						};

						return updatedSession;
					}
					return session;
				});
				return updated;
			});
		} finally {
			setIsSending(false);
		}
	};



	// Initialize default session if none exist - wait for hydration (RUN ONLY ONCE)
	useEffect(() => {
		if (!isHydrated) return; // Wait for hydration to complete
		if (isInitialized) return; // Only run once
		
		if (chatSessions.length === 0) {
			const defaultSession: ChatSession = {
				id: defaultSessionId, // Use the stable ID we created
				title: 'New Chat',
				messages: [{ role: 'assistant', content: 'Hi! I can help with GCSE Maths using Mentara. Ask a question or upload an image and tell me about it.' }],
				timestamp: new Date()
			};
			setChatSessions([defaultSession]);
			setCurrentSessionId(defaultSession.id);
		} else {
			setCurrentSessionId(chatSessions[0].id);
		}
		
		setIsInitialized(true);
	}, [isHydrated]); // Only depend on hydration, not on chatSessions or isInitialized
	
	// Show loading state until hydration is complete
	if (!isHydrated) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading chat...</p>
				</div>
			</div>
		);
	}
	
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
								messages.map((msg, index) => (
									<div
										key={index}
										className={`flex ${
											msg.role === 'user' ? 'justify-end' : 'justify-start'
										}`}
									>
										<div
											className={`max-w-xl px-4 py-2 rounded-lg shadow ${
												msg.role === 'user'
													? 'bg-primary-600 text-white'
													: 'bg-gray-200 text-gray-800'
											}`}
										>
											<MarkdownMessage content={msg.content} />
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
