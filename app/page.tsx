"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, ImageIcon, Pencil, Plus, MessageCircle, LayoutDashboard, FileText } from 'lucide-react';
import DrawingPad from '@/components/DrawingPad';
import ChatMessage from '@/components/ChatMessage';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LeftSidebar from '@/components/LeftSidebar';
import ModelSelector from '@/components/ModelSelector';
import { ModelType } from '@/config/aiModels';
// Removed useDefaultModel hook to fix display issues
import { detectExamQuestion, getCorrectAnswer } from '@/data/pastExamQuestions';
import { addCompletedQuestion, updateQuestionStatus, UserProgress, calculateProgressStats } from '@/data/progressTracking';

type ChatItem = { 
	role: 'user' | 'assistant'; 
	content: string;
	imageData?: string; // Store actual image data for thumbnails
	imageName?: string; // Store image filename
	apiUsed?: string; // Store which specific API was used for this response
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
			console.log('🔄 useLocalStorage hydration effect for key:', key);
			
			if (typeof window !== 'undefined') {
				try {
					const item = window.localStorage.getItem(key);
					if (item) {
						const parsed = JSON.parse(item);
						console.log('📥 Loaded from localStorage:', { key, parsed });
						setStoredValue(parsed);
					} else {
						console.log('📭 No localStorage data for key:', key);
					}
				} catch (error) {
					console.error(`Error reading localStorage key "${key}":`, error);
					// If we can't read the data, reset to initial value
					setStoredValue(initialValue);
				}
				console.log('✅ Setting isHydrated to true for key:', key);
				setIsHydrated(true);
			} else {
				console.log('🌐 Window not available, skipping hydration for key:', key);
			}
			
			// Fallback: force hydration after 2 seconds to prevent infinite loading
			const timeoutId = setTimeout(() => {
				console.log('⏰ Fallback: forcing hydration completion for key:', key);
				setIsHydrated(true);
			}, 2000);
			
			return () => clearTimeout(timeoutId);
		}, [key, initialValue]); // Removed isHydrated from dependencies to prevent infinite loop

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
	}, [isHydrated]); // Only depend on isHydrated, not on chatSessions.length
	
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
	  	    const [selectedModel, setSelectedModel] = useState<ModelType>('gemini-2.5-pro'); // Default to Gemini 2.5 Pro for main chat
	const fileRef = useRef<HTMLInputElement | null>(null);

	// Progress tracking state
	const [userProgress, setUserProgress] = useState<UserProgress>({
		completedQuestions: [],
		stats: calculateProgressStats([]),
		lastUpdated: new Date()
	});

	// Load progress from localStorage on mount
	useEffect(() => {
		if (typeof window !== 'undefined') {
			try {
				const savedProgress = localStorage.getItem('userProgress');
				if (savedProgress) {
					const parsed = JSON.parse(savedProgress);
					setUserProgress(parsed);
				}
			} catch (error) {
				console.error('Error loading user progress:', error);
			}
		}
	}, []);

	// Function to detect if a user message contains an answer
	const detectUserAnswer = useCallback((message: string): { hasAnswer: boolean; answerText?: string } => {
		// Simple heuristics to detect if a message contains an answer
		const answerPatterns = [
			/answer\s*is\s*:?\s*(.+)/i,
			/answer\s*:?\s*(.+)/i,
			/result\s*is\s*:?\s*(.+)/i,
			/result\s*:?\s*(.+)/i,
			/solution\s*is\s*:?\s*(.+)/i,
			/solution\s*:?\s*(.+)/i,
			/equals?\s*:?\s*(.+)/i,
			/=?\s*([^=]+)$/i, // Ends with equals sign or just text
			/^([^?]+)$/i // No question mark, might be just an answer
		];
		
		for (const pattern of answerPatterns) {
			const match = message.match(pattern);
			if (match && match[1]) {
				const answerText = match[1].trim();
				// Check if the answer text is substantial (not just punctuation)
				if (answerText.length > 1 && !/^[^\w]*$/.test(answerText)) {
					return { hasAnswer: true, answerText };
				}
			}
		}
		
		// Check if message doesn't contain question words and is short (likely an answer)
		const questionWords = /\b(what|how|why|when|where|who|which|can|could|would|will|do|does|is|are|was|were)\b/i;
		const hasQuestionWords = questionWords.test(message);
		const isShort = message.length < 50;
		
		if (!hasQuestionWords && isShort && !message.includes('?')) {
			return { hasAnswer: true, answerText: message.trim() };
		}
		
		return { hasAnswer: false };
	}, []);

	// Function to track asked question (without answer)
	const trackAskedQuestion = useCallback((questionText: string, sessionId: string) => {
		const examMetadata = detectExamQuestion(questionText);
		
		if (examMetadata) {
			console.log('📝 Tracking asked question:', examMetadata.id);
			
			const updatedProgress = addCompletedQuestion(
				userProgress,
				examMetadata.id,
				examMetadata.question,
				examMetadata.examBoard,
				examMetadata.year,
				examMetadata.paper,
				examMetadata.questionNumber,
				examMetadata.category,
				examMetadata.marks,
				examMetadata.difficulty,
				examMetadata.topic,
				sessionId
				// No userAnswer or correctAnswer - will be marked as 'asked'
			);
			
			// Update state
			setUserProgress(updatedProgress);
			
			// Save to localStorage
			try {
				localStorage.setItem('userProgress', JSON.stringify(updatedProgress));
			} catch (error) {
				console.error('Error saving progress:', error);
			}
		}
	}, [userProgress]);

	// Function to track completed question with answer
	const trackCompletedQuestion = useCallback((questionText: string, userAnswer: string, sessionId: string) => {
		const examMetadata = detectExamQuestion(questionText);
		
		if (examMetadata) {
			console.log('📈 Tracking completed question with answer:', examMetadata.id);
			
			// Get the correct answer from the full exam papers data
			const correctAnswer = getCorrectAnswer(examMetadata.id);
			
			if (correctAnswer) {
				// Update the question status with the user's answer
				const updatedProgress = updateQuestionStatus(
					userProgress,
					examMetadata.id,
					userAnswer,
					correctAnswer
				);
				
				// Update state
				setUserProgress(updatedProgress);
				
				// Save to localStorage
				try {
					localStorage.setItem('userProgress', JSON.stringify(updatedProgress));
				} catch (error) {
					console.error('Error saving progress:', error);
				}
			} else {
				console.log('⚠️ No correct answer available for question:', examMetadata.id);
			}
		}
	}, [userProgress]);

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
			title: 'Loading...', // Will be updated with random question or user input
			messages: [{ role: 'assistant', content: 'Hi! I can help with GCSE Maths using Mentara. Ask a question or upload an image and tell me about it.' }],
			timestamp: new Date()
		};
		
		console.log('🆕 Creating new chat session:', newSession);
		
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
		console.log('Chat Sessions:', chatSessions);
		
		// Allow sending even with blank text (for random question generation)
		if (!text && !uploadedImage) {
			console.log('🎲 Sending blank message for random questions');
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
				console.log('⏰ Sending message after session creation delay');
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
		
		console.log('📤 sendMessage called with:', { text, currentSessionId });
		
		setIsSending(true);
		const userMsg: ChatItem = { 
			role: 'user', 
			content: text || (uploadedImage ? `[📷 Image: ${uploadName}]` : ''),
			imageData: uploadedImage || undefined,
			imageName: uploadName || undefined
		};
		
		console.log('📝 User message created:', userMsg);
		
		// Store the current session data to ensure we don't lose it
		const currentSession = chatSessions.find(s => s.id === currentSessionId);
		if (!currentSession) {
			console.log('❌ No current session found');
			setIsSending(false);
			return;
		}
		
		console.log('📋 Current session before update:', currentSession);
		
		// Store the title that should be preserved
		const titleToPreserve = currentSession.messages.length === 1 
			? (text ? text.slice(0, 30) + (text.length > 30 ? '...' : '') : `Image: ${uploadName}`)
			: currentSession.title;

		// IMMEDIATELY add user message to chat for instant feedback
		setChatSessions(prev => {
			const updated = prev.map(session => {
				if (session.id === currentSessionId) {
					// For blank messages, keep the current title (will be updated later with random question)
					// For real messages, update the title immediately
					const newTitle = text && text.trim() !== '' 
						? text.slice(0, 30) + (text.length > 30 ? '...' : '')
						: session.title; // Keep existing title for blank messages
					
					console.log('📝 Immediate title update:', { oldTitle: session.title, newTitle, hasText: !!text, isBlank: !text || text.trim() === '' });
					
					const updatedSession = {
						...session,
						title: newTitle,
						messages: [...session.messages, userMsg],
						timestamp: new Date()
					};
					
					console.log('📝 Updated session:', updatedSession);
					return updatedSession;
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
				imageName: uploadName || undefined,
				model: selectedModel
			};
			
			console.log('=== API REQUEST DEBUG ===');
			console.log('Request body:', requestBody);
			console.log('Image data length:', uploadedImage ? uploadedImage.length : 0);
			
			const resp = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestBody),
			});
			
			console.log('=== API RESPONSE DEBUG ===');
			console.log('Response status:', resp.status);
			console.log('Response ok:', resp.ok);
			console.log('Response headers:', resp.headers);
			
			if (!resp.ok) {
				console.error('API response not ok:', resp.status, resp.statusText);
				throw new Error(`API error: ${resp.status} ${resp.statusText}`);
			}
			
			const data = await resp.json();
			console.log('Response data:', data);
			
			if (data.error) {
				console.error('API returned error:', data.error);
				throw new Error(data.error);
			}
			
		// Check if this was a random question generation
		if (data.isRandomGenerated && data.randomQuestion) {
			console.log('🎯 Handling random question generation');
			console.log('📋 Random question data:', data);
			console.log('🔍 Random question text:', data.randomQuestion);
			
			// First, update the input box with the random question
			setInput(data.randomQuestion);
			
			// Add the random question as user message
			const randomUserMsg: ChatItem = { 
				role: 'user', 
				content: data.randomQuestion
			};
			
			// Update the session with random question, title, and assistant reply in one operation
			setChatSessions(prev => {
				console.log('🔄 Previous chat sessions:', prev);
				const updated = prev.map(session => {
					if (session.id === currentSessionId) {
						// Remove the last message (blank user message) and add random question + reply
						const messages = session.messages.slice(0, -1);
						const truncatedTitle = data.randomQuestion.slice(0, 30) + (data.randomQuestion.length > 30 ? '...' : '');
						
						console.log('🎯 Updating session title to random question:', truncatedTitle);
						console.log('📝 Session before update:', session);
						
						const updatedSession = {
							...session,
							title: truncatedTitle, // Update title with random question
							messages: [...messages, randomUserMsg, { role: 'assistant' as const, content: data.reply, apiUsed: data.apiUsed }],
							timestamp: new Date()
						};
						
						console.log('📝 Session after update:', updatedSession);
						return updatedSession;
					}
					return session;
				});
				console.log('🔄 Updated chat sessions:', updated);
				return updated;
			});
			
			// Track progress for random questions
			trackAskedQuestion(data.randomQuestion, currentSessionId);
			
			setIsSending(false);
			return;
		}
		
		const reply = data?.reply || 'Sorry, I could not respond right now.';
		
		// Track progress for exam questions (only for text-based questions)
		if (text && !uploadedImage) {
			// Check if the user message contains an answer
			const answerDetection = detectUserAnswer(text);
			
			if (answerDetection.hasAnswer && answerDetection.answerText) {
				// User provided an answer - track as completed
				trackCompletedQuestion(text, answerDetection.answerText, currentSessionId);
			} else {
				// User just asked a question - track as asked
				trackAskedQuestion(text, currentSessionId);
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
								messages: [...currentMessages, { role: 'assistant' as const, content: reply, apiUsed: data.apiUsed }],
								timestamp: new Date()
							};
						} else {
							// If user message was lost, add both user message and assistant reply
							return {
								...session,
								title: titleToPreserve,
								messages: [...currentMessages, userMsg, { role: 'assistant' as const, content: reply, apiUsed: data.apiUsed }],
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
								messages: [...currentMessages, { role: 'assistant' as const, content: 'Network error. Please try again.', apiUsed: 'Error Response' }],
								timestamp: new Date()
							};
						} else {
							// If user message was lost, add both user message and error message
							return {
								...session,
								title: titleToPreserve,
								messages: [...currentMessages, userMsg, { role: 'assistant' as const, content: 'Network error. Please try again.', apiUsed: 'Error Response' }],
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
		console.log('🔄 Hydration effect running:', { isHydrated, isInitialized, chatSessionsLength: chatSessions.length });
		
		if (!isHydrated) {
			console.log('⏳ Waiting for hydration to complete...');
			return; // Wait for hydration to complete
		}
		if (isInitialized) {
			console.log('✅ Already initialized, skipping...');
			return; // Only run once
		}
		
		console.log('🚀 Initializing default session...');
		
		if (chatSessions.length === 0) {
			const defaultSession: ChatSession = {
				id: defaultSessionId, // Use the stable ID we created
				title: 'New Chat',
				messages: [{ role: 'assistant', content: 'Hi! I can help with GCSE Maths using Mentara. Ask a question or upload an image and tell me about it.' }],
				timestamp: new Date()
			};
			console.log('🆕 Creating default session:', defaultSession);
			setChatSessions([defaultSession]);
			setCurrentSessionId(defaultSession.id);
		} else {
			console.log('📋 Using existing session:', chatSessions[0].id);
			setCurrentSessionId(chatSessions[0].id);
		}
		
		setIsInitialized(true);
		console.log('✅ Initialization complete');
	}, [isHydrated, isInitialized]); // Removed chatSessions.length and defaultSessionId to prevent infinite loops
	
	// Show loading state until hydration is complete
	if (!isHydrated) {
		console.log('🔄 Rendering loading state - isHydrated:', isHydrated);
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading chat...</p>
					<p className="text-xs text-gray-400 mt-2">Debug: isHydrated = {String(isHydrated)}</p>
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
					userProgress={userProgress}
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
					{/* Header with Model Selector */}
					<div className="bg-white border-b border-gray-200 px-6 py-3">
						<div className="max-w-4xl mx-auto">
							<div className="flex items-center space-x-4">
								<ModelSelector 
									onModelChange={setSelectedModel}
									initialModel={selectedModel}
									className="justify-start"
								/>
								<div className="text-sm text-gray-600">
									                        Current Model: <span className="font-medium text-blue-600">{selectedModel === 'chatgpt-5' ? 'ChatGPT 5' : selectedModel === 'chatgpt-4o' ? 'ChatGPT 4o' : 'Gemini 2.5 Pro'}</span>
								</div>
							</div>
						</div>
					</div>
					
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
												className={`min-w-[680px] max-w-xl px-4 py-2 rounded-lg shadow ${
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
													model={msg.role === 'assistant' ? selectedModel : undefined}
													apiUsed={msg.apiUsed}
												/>
											</div>
										</div>
									))}
									
									{/* Waiting animation when sending message */}
									{isSending && (
										<div className="flex justify-start">
											<div className="min-w-[680px] max-w-xl px-4 py-2 rounded-lg shadow bg-gray-200 text-gray-800">
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
