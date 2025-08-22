"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, ImageIcon, Pencil, Plus, MessageCircle, LayoutDashboard, FileText } from 'lucide-react';
import DrawingPad from '@/components/DrawingPad';
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
};

	// Utility functions for localStorage management
	function getLocalStorageSize(): number {
		let total = 0;
		for (let key in localStorage) {
			if (localStorage.hasOwnProperty(key)) {
				total += localStorage[key].length + key.length;
			}
		}
		return total;
	}

	function cleanupOldChatSessions(sessions: ChatSession[], maxSessions = 50): ChatSession[] {
		if (sessions.length <= maxSessions) return sessions;
		
		// Sort by timestamp (newest first) and keep only the most recent sessions
		const sortedSessions = [...sessions].sort((a, b) => 
			new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
		);
		
		console.log(`Cleaning up chat sessions: keeping ${maxSessions} of ${sessions.length} sessions`);
		return sortedSessions.slice(0, maxSessions);
	}

	function compactChatSessions(sessions: ChatSession[]): ChatSession[] {
		return sessions.map(session => ({
			...session,
			messages: session.messages.map(msg => ({
				...msg,
				// Remove large image data from old messages to save space, keeping only recent ones
				imageData: session.messages.indexOf(msg) < session.messages.length - 5 ? undefined : msg.imageData
			}))
		}));
	}

	// Custom hook for localStorage persistence with quota management - HYDRATION SAFE
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
					// If we can't read the data, reset to initial value
					setStoredValue(initialValue);
				}
				setIsHydrated(true);
			}
		}, [key, initialValue]);

		const setValue = useCallback((value: T | ((val: T) => T)) => {
			try {
				const valueToStore = value instanceof Function ? value(storedValue) : value;
				setStoredValue(valueToStore);
				
				if (typeof window !== 'undefined' && isHydrated) {
					const dataToStore = JSON.stringify(valueToStore);
					
					try {
						window.localStorage.setItem(key, dataToStore);
					} catch (quotaError) {
						console.warn(`LocalStorage quota exceeded for key "${key}". Attempting cleanup...`);
						
						// If it's chat sessions, try to clean up
						if (key === 'chatSessions' && Array.isArray(valueToStore)) {
							try {
								// First, try compacting sessions (remove old image data)
								let compactedSessions = compactChatSessions(valueToStore as ChatSession[]);
								let compactedData = JSON.stringify(compactedSessions);
								
								try {
									window.localStorage.setItem(key, compactedData);
									console.log('Successfully stored compacted chat sessions');
									return;
								} catch (stillTooLarge) {
									// Still too large, try keeping fewer sessions
									let cleanedSessions = cleanupOldChatSessions(compactedSessions as ChatSession[], 25);
									let cleanedData = JSON.stringify(cleanedSessions);
									
									try {
										window.localStorage.setItem(key, cleanedData);
										console.log('Successfully stored cleaned chat sessions (reduced to 25 sessions)');
										// Update the state to reflect the cleaned data
										setStoredValue(cleanedSessions as T);
										return;
									} catch (stillFailed) {
										// Last resort: keep only 10 most recent sessions
										let minimalSessions = cleanupOldChatSessions(cleanedSessions as ChatSession[], 10);
										let minimalData = JSON.stringify(minimalSessions);
										window.localStorage.setItem(key, minimalData);
										console.log('Successfully stored minimal chat sessions (reduced to 10 sessions)');
										// Update the state to reflect the minimal data
										setStoredValue(minimalSessions as T);
										return;
									}
								}
							} catch (cleanupError) {
								console.error('Failed to cleanup chat sessions:', cleanupError);
							}
						}
						
						// General cleanup: try to free up space by removing other keys
						console.log('Attempting general localStorage cleanup...');
						const storageSize = getLocalStorageSize();
						console.log(`Current localStorage size: ${Math.round(storageSize / 1024)}KB`);
						
						// Remove non-essential keys if they exist
						const nonEssentialKeys = ['debug_', 'temp_', 'cache_'];
						let cleaned = false;
						for (let storageKey of Object.keys(localStorage)) {
							if (nonEssentialKeys.some(prefix => storageKey.startsWith(prefix))) {
								localStorage.removeItem(storageKey);
								cleaned = true;
							}
						}
						
						if (cleaned) {
							try {
								window.localStorage.setItem(key, dataToStore);
								console.log('Successfully stored after general cleanup');
								return;
							} catch (finalError) {
								console.error('Still failed after cleanup:', finalError);
							}
						}
						
						// If all else fails, show user-friendly error
						console.error(`Critical: Cannot store data for key "${key}" - localStorage is full`);
						alert('Storage is full! Some chat history may be lost. The app will continue to work, but consider clearing your browser data or starting fresh conversations.');
					}
				}
			} catch (error) {
				console.error(`Error setting localStorage key "${key}":`, error);
			}
		}, [key, storedValue, isHydrated]);

		return [storedValue, setValue, isHydrated] as const;
	}

export default function ChatHome() {
	
	
	const router = useRouter();

	// State for storage info to prevent infinite re-renders
	const [storageInfo, setStorageInfo] = useState<{
		totalSize: number;
		chatSize: number;
		totalSizeMB: number;
	} | null>(null);

	// Function to update storage info
	const updateStorageInfo = useCallback(() => {
		if (typeof window === 'undefined') return;
		
		const total = getLocalStorageSize();
		const chatData = localStorage.getItem('chatSessions');
		const chatSize = chatData ? chatData.length : 0;
		
		setStorageInfo({
			totalSize: Math.round(total / 1024), // KB
			chatSize: Math.round(chatSize / 1024), // KB
			totalSizeMB: Math.round(total / (1024 * 1024) * 100) / 100, // MB
		});
	}, []);

	// Create a consistent session ID - use useRef to ensure it's stable across re-renders
	const defaultSessionIdRef = useRef<string>('');
	if (!defaultSessionIdRef.current) {
		defaultSessionIdRef.current = Date.now().toString();
	}
	const defaultSessionId = defaultSessionIdRef.current;
	
	// Create stable initial value to prevent infinite re-renders
	const initialChatSessions = useMemo(() => [], []);
	
	// Initialize with empty array - let the useEffect handle creating default session if needed
	const [chatSessions, setChatSessions, isHydrated] = useLocalStorage<ChatSession[]>('chatSessions', initialChatSessions);

	// Update storage info when chat sessions change (debounced)
	useEffect(() => {
		if (isHydrated) {
			const timeoutId = setTimeout(() => {
				if (typeof window !== 'undefined') {
					const total = getLocalStorageSize();
					const chatData = localStorage.getItem('chatSessions');
					const chatSize = chatData ? chatData.length : 0;
					
					setStorageInfo({
						totalSize: Math.round(total / 1024), // KB
						chatSize: Math.round(chatSize / 1024), // KB
						totalSizeMB: Math.round(total / (1024 * 1024) * 100) / 100, // MB
					});
				}
			}, 1000); // Debounce for 1 second
			return () => clearTimeout(timeoutId);
		}
	}, [chatSessions.length, isHydrated]);
	
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

	// Function to manually clear storage
	const clearAllStorage = useCallback(() => {
		if (window.confirm('This will clear all chat history. Are you sure?')) {
			try {
				localStorage.removeItem('chatSessions');
				setChatSessions([]);
				// Update storage info immediately after clearing
				setStorageInfo({
					totalSize: 0,
					chatSize: 0,
					totalSizeMB: 0,
				});
				// Optionally reload to reset everything
				// window.location.reload();
			} catch (error) {
				console.error('Error clearing storage:', error);
			}
		}
	}, [setChatSessions]);

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
		
		console.log('=== SEND FUNCTION DEBUG ===');
		console.log('Text:', text);
		console.log('Uploaded Image:', uploadedImage);
		console.log('Upload Name:', uploadName);
		console.log('Current Session ID:', currentSessionId);
		
		// Allow sending even with blank text (for random question generation)
		if (!text && !uploadedImage) {
			console.log('Sending blank message for random questions');
			// Still proceed to send empty message for random question generation
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
			const requestBody = { 
				message: text || (uploadedImage ? 'Please analyze this image' : ''), 
				imageData: uploadedImage || undefined,
				imageName: uploadName || undefined 
			};
			
			console.log('=== API REQUEST DEBUG ===');
			console.log('Request body:', requestBody);
			console.log('Image data length:', uploadedImage ? uploadedImage.length : 0);
			
			const resp = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestBody),
					});
		const data = await resp.json();
		
		// Check if this was a random question generation
		if (data.isRandomGenerated && data.randomQuestion) {
			console.log('🎯 Handling random question generation');
			
			// First, update the input box with the random question
			setInput(data.randomQuestion);
			
			// Clear the user message we just added (since it was blank)
			setChatSessions(prev => {
				const updated = prev.map(session => {
					if (session.id === currentSessionId) {
						// Remove the last message (blank user message)
						const messages = session.messages.slice(0, -1);
						return {
							...session,
							messages: messages,
							timestamp: new Date()
						};
					}
					return session;
				});
				return updated;
			});
			
			// Add the random question as user message
			const randomUserMsg: ChatItem = { 
				role: 'user', 
				content: data.randomQuestion
			};
			
			setChatSessions(prev => {
				const updated = prev.map(session => {
					if (session.id === currentSessionId) {
						const newTitle = session.messages.length === 0 
							? data.randomQuestion.slice(0, 30) + (data.randomQuestion.length > 30 ? '...' : '')
							: session.title;
						
						return {
							...session,
							title: newTitle,
							messages: [...session.messages, randomUserMsg, { role: 'assistant' as const, content: data.reply }],
							timestamp: new Date()
						};
					}
					return session;
				});
				return updated;
			});
			
			setIsSending(false);
			return;
		}
		
		const reply = data?.reply || 'Sorry, I could not respond right now.';
		
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
								timestamp: new Date()
							};
						} else {
							// If user message was lost, add both user message and assistant reply
							return {
								...session,
								title: titleToPreserve,
								messages: [...currentMessages, userMsg, { role: 'assistant' as const, content: reply }],
								timestamp: new Date()
							};
						}
					}
					return session;
				});
				return updated;
			});
		} catch (e) {
			console.error('Error in send function:', e);
			console.error('Error details:', {
				text,
				uploadedImage: !!uploadedImage,
				uploadName,
				currentSessionId
			});
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
				<LeftSidebar 
					onNewChat={createNewChat}
					onClearStorage={clearAllStorage}
					storageInfo={storageInfo}
				>
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
						</div>
					</div>

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
									disabled={isSending || !currentSessionId || isCreatingSession}
									className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md ${
										uploadedImage && !input.trim() 
											? 'bg-green-600 hover:bg-green-700 text-white' 
											: 'bg-primary-600 hover:bg-primary-700 text-white'
									} ${
										isSending || !currentSessionId || isCreatingSession
											? 'bg-gray-400 cursor-not-allowed'
											: ''
									}`}
									title={
										!currentSessionId ? 'No active session' 
										: isSending ? 'Sending...' 
										: isCreatingSession ? 'Creating session...' 
										: !input.trim() && !uploadedImage ? 'Send for random practice questions' 
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
