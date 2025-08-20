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
					console.log(`=== CUSTOM HOOK: Hydrated from localStorage for ${key} ===`, parsed);
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
				console.log(`=== CUSTOM HOOK: localStorage save SUCCESSFUL for ${key} ===`);
				console.log(`=== CUSTOM HOOK: Saved value ===`, valueToStore);
				
				// Debug: Check if titles are being saved
				if (key === 'chatSessions' && Array.isArray(valueToStore)) {
					console.log(`=== CUSTOM HOOK: Session titles being saved ===`, valueToStore.map(s => ({ id: s.id, title: s.title })));
				}
			}
		} catch (error) {
			console.error(`Error setting localStorage key "${key}":`, error);
		}
	}, [key, storedValue, isHydrated]);

	return [storedValue, setValue, isHydrated] as const;
}

export default function ChatHome() {
	console.log('=== CHAT PAGE: Component rendering ===');
	
	const router = useRouter();
	
	// Create a consistent session ID
	const defaultSessionId = Date.now().toString();
	
	// Initialize with a default session immediately
	const [chatSessions, setChatSessions, isHydrated] = useLocalStorage<ChatSession[]>('chatSessions', [{
		id: defaultSessionId,
		title: 'New Chat',
		messages: [{ role: 'assistant', content: 'Hi! I can help with GCSE Maths using Mentara. Ask a question or upload an image and tell me about it.' }],
		timestamp: new Date()
	}]);
	
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
		
		// Update messages in current session with user message AND title update
		setChatSessions(prev => {
			const updated = prev.map(session => {
				if (session.id === currentSessionId) {
					// Check if this is the first user message (session has only 1 message - the assistant's welcome)
					const shouldUpdateTitle = session.messages.length === 1;
					const newTitle = shouldUpdateTitle 
						? text.slice(0, 30) + (text.length > 30 ? '...' : '')
						: session.title;
					
					if (shouldUpdateTitle) {
						console.log('=== CHAT PAGE: First user message, updating title to ===', newTitle);
					}
					
					return {
						...session,
						title: newTitle,
						messages: [...session.messages, userMsg],
						timestamp: new Date()
					};
				}
				return session;
			});
			console.log('=== CHAT PAGE: Added user message to session with title update ===', updated);
			return updated;
		});

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
				console.log('=== CHAT PAGE: Added assistant reply to session ===', updated);
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

	// Manual localStorage save function - backup method
	const saveToLocalStorage = () => {
		if (typeof window === 'undefined') return;
		
		try {
			const jsonString = JSON.stringify(chatSessions);
			localStorage.setItem('chatSessions', jsonString);
			console.log('=== CHAT PAGE: MANUAL localStorage save SUCCESSFUL ===');
			console.log('=== CHAT PAGE: Manual save - sessions count ===', chatSessions.length);
			
			// Verify the save
			const saved = localStorage.getItem('chatSessions');
			if (saved) {
				const parsed = JSON.parse(saved);
				console.log('=== CHAT PAGE: Manual save verification - saved sessions count ===', parsed.length);
				console.log('=== CHAT PAGE: Manual save verification - first session messages count ===', parsed[0]?.messages?.length || 0);
			}
		} catch (error) {
			console.error('=== CHAT PAGE: MANUAL localStorage save FAILED ===', error);
		}
	};

	// Initialize default session if none exist - wait for hydration
	useEffect(() => {
		if (!isHydrated) return; // Wait for hydration to complete
		
		if (chatSessions.length === 0 && !isInitialized) {
			console.log('=== CHAT PAGE: No sessions found, creating default ===');
			const defaultSession: ChatSession = {
				id: Date.now().toString(),
				title: 'New Chat',
				messages: [{ role: 'assistant', content: 'Hi! I can help with GCSE Maths using Mentara. Ask a question or upload an image and tell me about it.' }],
				timestamp: new Date()
			};
			setChatSessions([defaultSession]);
			setCurrentSessionId(defaultSession.id);
			setIsInitialized(true);
		} else if (chatSessions.length > 0 && !isInitialized) {
			console.log('=== CHAT PAGE: Sessions found, setting current ===');
			setCurrentSessionId(chatSessions[0].id);
			setIsInitialized(true);
		}
	}, [chatSessions.length, isInitialized, setChatSessions, isHydrated]);

	console.log('=== CHAT PAGE: About to return JSX ===');
	
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
						{/* Debug: Show all session titles */}
						<div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
							<strong>DEBUG - All Session Titles:</strong>
							{chatSessions.map((s, i) => (
								<div key={s.id} className="text-red-700">
									{i + 1}. ID: {s.id.slice(-4)} | Title: "{s.title}" | Messages: {s.messages.length}
								</div>
							))}
						</div>
						
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
							
							{/* Debug localStorage save button */}
							<div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
								<div className="flex items-center justify-between">
									<span className="text-sm text-blue-800">Debug: localStorage Save</span>
									<button
										onClick={saveToLocalStorage}
										className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
									>
										Save Now
									</button>
								</div>
								<div className="text-xs text-blue-600 mt-1">
									Sessions: {chatSessions.length} | Current: {currentSessionId ? 'Yes' : 'No'}
								</div>
							</div>
							
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
