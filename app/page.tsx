"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, ImageIcon, Pencil, Plus, MessageCircle, LayoutDashboard, FileText } from 'lucide-react';
import DrawingPad from '@/components/DrawingPad';
import MarkdownMessage from '@/components/MarkdownMessage';
import GeometryDiagram from '@/components/GeometryDiagram';
import ChatMessage from '@/components/ChatMessage';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LeftSidebar from '@/components/LeftSidebar';

type ChatItem = { 
	role: 'user' | 'assistant'; 
	content: string;
	imageData?: string; // Store actual image data for thumbnails
	imageName?: string; // Store image filename
};
type ChatSession = {
	id: string;
	title: string;
	messages: ChatItem[];
	timestamp: Date;
	geometryData?: any;
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
					// Don't set error state here as it's not critical
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
				// Don't set error state here as it's not critical
			}
		}, [key, storedValue, isHydrated]);

		return [storedValue, setValue, isHydrated] as const;
	}

export default function ChatHome() {
	const [error, setError] = useState<string | null>(null);
	
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
	const [uploadedImage, setUploadedImage] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [showNotepad, setShowNotepad] = useState(false);
	const [isSending, setIsSending] = useState(false);
	const [isCreatingSession, setIsCreatingSession] = useState(false);
	const fileRef = useRef<HTMLInputElement | null>(null);

	// Clear uploaded image
	const clearImage = () => {
		setUploadName(null);
		setUploadedImage(null);
		if (fileRef.current) {
			fileRef.current.value = '';
		}
	};

	// Handle image upload
	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Validate file size (max 5MB)
			if (file.size > 5 * 1024 * 1024) {
				alert('Image size must be less than 5MB');
				return;
			}

			// Validate file type
			if (!file.type.startsWith('image/')) {
				alert('Please select a valid image file');
				return;
			}

			setUploadName(file.name);
			setIsUploading(true);

			// Create preview URL
			const reader = new FileReader();
			reader.onload = (event) => {
				if (event.target?.result) {
					setUploadedImage(event.target.result as string);
				}
				setIsUploading(false);
			};
			reader.readAsDataURL(file);
		}
	};

	// Get current session
	const currentSession = chatSessions.find(session => session.id === currentSessionId);
	const messages = currentSession?.messages || [];
	const geometryData = currentSession?.geometryData || null;

	// Check if current session is a geometry test session
	const isGeometrySession = currentSessionId === 'geometry-test';

	// Create new chat session
	const createNewChat = () => {
		if (isCreatingSession) return; // Prevent multiple simultaneous creations
		
		setIsCreatingSession(true);
		const newSession: ChatSession = {
			id: Date.now().toString(),
			title: 'New Chat',
			messages: [{ role: 'assistant', content: 'Hi! I can help with GCSE Maths using Mentara. Ask a question or upload an image and tell me about it.' }],
			timestamp: new Date(),
			geometryData: null
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
		if (sessionId === 'geometry-test') return; // Don't delete the geometry test session
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
		
		// Allow sending if there's either text or an image
		if (!text && !uploadedImage) {
			return;
		}
		
		// Ensure we have a session before sending
		if (!currentSessionId || chatSessions.length === 0) {
			if (isCreatingSession) return; // Don't create multiple sessions
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
		const userMsg: ChatItem = { 
			role: 'user', 
			content: text || (uploadedImage ? `[📷 Image: ${uploadName}]` : ''),
			imageData: uploadedImage || undefined,
			imageName: uploadName || undefined
		};
		
		// Store the current session data to ensure we don't lose it
		const currentSession = chatSessions.find(s => s.id === currentSessionId);
		if (!currentSession) {
			setIsSending(false);
			return;
		}

		// Store the title that should be preserved
		const titleToPreserve = currentSession.messages.length === 1 
			? (text ? text.slice(0, 30) + (text.length > 30 ? '...' : '') : `Image: ${uploadName}`)
			: currentSession.title;

		// IMMEDIATELY add user message to chat for instant feedback
		setChatSessions(prev => {
			const updated = prev.map(session => {
				if (session.id === currentSessionId) {
					return {
						...session,
						title: titleToPreserve,
						messages: [...session.messages, userMsg],
						timestamp: new Date()
					};
				}
				return session;
			});
			return updated;
		});

		setInput('');
		// Clear image after sending
		clearImage();
		try {
			// Use the new API format for geometry requests, fallback to old format for compatibility
			const requestBody = isGeometrySession ? {
				messages: [...(currentSession?.messages || []), userMsg],
				isGeometryRequest: true
			} : {
				message: text || (uploadedImage ? 'Please analyze this image' : ''), 
				imageData: uploadedImage || undefined,
				imageName: uploadName || undefined 
			};
			
			const resp = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestBody),
			});
			const data = await resp.json();
			const reply = data?.reply || 'Sorry, I could not respond right now.';
			
			// Parse geometry data if this is a geometry session
			let parsedGeometryData = null;
			if (isGeometrySession) {
				try {
					parsedGeometryData = JSON.parse(reply);
				} catch (error) {
					console.error('Failed to parse geometry JSON:', error);
				}
			}
			
			// Add assistant reply to the existing session - ensure we preserve the user message
			setChatSessions(prev => {
				const updated = prev.map(session => {
					if (session.id === currentSessionId) {
						// Verify that the user message is still there and add assistant reply
						const currentMessages = session.messages;
						const userMessageExists = currentMessages.some(msg => 
							msg.role === 'user' && msg.content === userMsg.content
						);
						
						// If user message exists, just add assistant reply
						if (userMessageExists) {
							return {
								...session,
								messages: [...currentMessages, { role: 'assistant' as const, content: reply }],
								timestamp: new Date(),
								geometryData: parsedGeometryData
							};
						} else {
							// If user message was lost, add both user message and assistant reply
							return {
								...session,
								title: titleToPreserve,
								messages: [...currentMessages, userMsg, { role: 'assistant' as const, content: reply }],
								timestamp: new Date(),
								geometryData: parsedGeometryData
							};
						}
					}
					return session;
				});
				return updated;
			});
		} catch (e) {
			console.error('Error in send function:', e);
			// Set error state for user feedback
			setError(e instanceof Error ? e.message : 'An error occurred while sending the message');
			// Clear image on error as well
			clearImage();
			// Error case: Add error message to the existing session - ensure we preserve the user message
			setChatSessions(prev => {
				const updated = prev.map(session => {
					if (session.id === currentSessionId) {
						// Verify that the user message is still there and add error message
						const currentMessages = session.messages;
						const userMessageExists = currentMessages.some(msg => 
							msg.role === 'user' && msg.content === userMsg.content
						);
						
						// If user message exists, just add error message
						if (userMessageExists) {
							return {
								...session,
								messages: [...currentMessages, { role: 'assistant' as const, content: 'Network error. Please try again.' }],
								timestamp: new Date()
							};
						} else {
							// If user message was lost, add both user message and error message
							return {
								...session,
								title: titleToPreserve,
								messages: [...currentMessages, userMsg, { role: 'assistant' as const, content: 'Network error. Please try again.' }],
								timestamp: new Date()
							};
						}
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
		try {
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
		} catch (e) {
			console.error('Error initializing chat sessions:', e);
			setError(e instanceof Error ? e.message : 'Failed to initialize chat sessions');
		}
	}, [isHydrated]); // Only depend on hydration, not on chatSessions or isInitialized
	
	// Show error state if there's an error
	if (error) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="text-red-500 mb-4">
						<svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
						</svg>
					</div>
					<h2 className="text-xl font-semibold text-red-600 mb-2">Something went wrong</h2>
					<p className="text-gray-600 mb-4">{error}</p>
					<button 
						onClick={() => window.location.reload()} 
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
					>
						Reload Page
					</button>
				</div>
			</div>
		);
	}

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
						{/* Recent Chats Header */}
						<div className="mb-4">
							<h3 className="text-sm font-medium text-gray-700 mb-3 px-1">Recent Chats</h3>
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
								<>
									{messages.map((msg, index) => (
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
												<ChatMessage 
													content={msg.content} 
													role={msg.role}
													imageData={msg.imageData}
													imageName={msg.imageName}
												/>
											</div>
										</div>
									))}
									
									{/* Waiting animation when sending message */}
									{isSending && (
										<div className="flex justify-start">
											<div className="max-w-xl px-4 py-2 rounded-lg shadow bg-gray-200 text-gray-800">
												<div className="flex items-center space-x-2">
													<div className="flex space-x-1">
														<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
														<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
														<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
													</div>
													<span className="text-sm text-gray-500 ml-2">Mentara is thinking...</span>
												</div>
											</div>
										</div>
									)}
								</>
							)}
							
							{/* Geometry Diagram */}
							{isGeometrySession && geometryData && (
								<div className="mt-6">
									<h3 className="text-lg font-semibold mb-4">Geometry Diagram</h3>
									<GeometryDiagram geometryData={geometryData} />
								</div>
							)}
						</div>
					</div>

					{/* Geometry Test Section */}
					{isGeometrySession && (
						<div className="mb-6 p-4 bg-blue-50 rounded-lg">
							<div className="flex flex-wrap gap-3">
								<button
									onClick={() => {
										setInput('I want to prove that the angle inside a semi-circle is always right angle. The present diagram contain a circle with centre C and a triangle QRS with QR side as diameter already drawn. What extra line should be drawn to help me prove the statement. No need for full prove just where to draw the line');
									}}
									className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
								>
									Load Geometry Question
								</button>
							</div>
						</div>
					)}

					{/* Input Bar */}
					<div className="bg-white p-6">
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
									onChange={handleImageUpload}
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
									placeholder="Ask questions, attach an image, or both. You can send just an image!"
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
									disabled={isSending || (!input.trim() && !uploadedImage) || !currentSessionId || isCreatingSession}
									className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md ${
										uploadedImage && !input.trim() 
											? 'bg-green-600 hover:bg-green-700 text-white' 
											: 'bg-primary-600 hover:bg-primary-700 text-white'
									} ${
										isSending || (!input.trim() && !uploadedImage) || !currentSessionId || isCreatingSession
											? 'bg-gray-400 cursor-not-allowed'
											: ''
									}`}
									title={
										!currentSessionId ? 'No active session' 
										: isSending ? 'Sending...' 
										: isCreatingSession ? 'Creating session...' 
										: !input.trim() && !uploadedImage ? 'Type a message or attach an image' 
										: uploadedImage && !input.trim() ? 'Send image' 
										: 'Send message'
									}
								>
									<Send className="w-5 h-5" />
								</button>
							</div>
							
							{/* Upload name display */}
							{uploadName && (
								<div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
									<div className="flex items-center space-x-3">
										{uploadedImage && (
											<div className="relative">
												<img 
													src={uploadedImage} 
													alt="Uploaded image" 
													className="w-16 h-16 object-cover rounded-lg"
												/>
												<button
													onClick={clearImage}
													className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
													title="Remove image"
												>
													×
												</button>
											</div>
										)}
										<div className="flex-1">
											<div className="flex items-center space-x-2 text-sm text-gray-600">
												<ImageIcon className="w-4 h-4" />
												<span className="font-medium">{uploadName}</span>
												{isUploading && (
													<div className="flex items-center space-x-1">
														<div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
														<div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
														<div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
													</div>
												)}
											</div>
											<p className="text-xs text-gray-500 mt-1">
												Image attached and ready to send
											</p>
										</div>
									</div>
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
