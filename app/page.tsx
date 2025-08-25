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
import { useFirestoreChat } from '@/hooks/useFirestoreChat';

import { useProgress } from '@/hooks/useProgress';
import { Timestamp } from 'firebase/firestore';

// Import types from Firestore service
import type { ChatItem, ChatSession } from '@/services/firestoreService';

export default function ChatHome() {
	const router = useRouter();

	// Use Firestore hook for chat management
	const {
		chatSessions,
		currentSessionId,
		isLoading,
		error,
		createNewChat,
		switchToSession,
		updateSessionTitle,
		deleteSession,
		addMessageToCurrentSession,
		clearAllSessions,
		refreshSessions
	} = useFirestoreChat();

	// Function to update session messages
	const updateSessionMessages = useCallback(async (sessionId: string, messages: any[]) => {
		try {
			// For now, we'll just refresh the sessions to get the updated data
			// The message will be updated in the local state when we refresh
			await refreshSessions();
		} catch (error) {
			console.error('Error updating session messages:', error);
		}
	}, [refreshSessions]);

	// Check if we're on the client side
	const [isClient, setIsClient] = useState(false);
	
	useEffect(() => {
		setIsClient(true);
	}, []);

	// Function to clear all chat sessions
	const handleClearStorage = useCallback(async () => {
		if (confirm('Are you sure you want to clear all chat sessions? This action cannot be undone.')) {
			try {
				await clearAllSessions();
				console.log('✅ All chat sessions cleared');
			} catch (error) {
				console.error('Error clearing chat sessions:', error);
			}
		}
	}, [clearAllSessions]);

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

	  // Progress tracking using the new hook
  const { 
    userProgress, 
    addCompletedQuestion: addProgressQuestion,
    updateQuestionStatus: updateProgressStatus 
  } = useProgress('default-user');

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

	// Function to manually clear storage


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
	const handleCreateNewChat = async () => {
		if (isCreatingSession) return; // Prevent multiple simultaneous creations
		
		setIsCreatingSession(true);
		try {
			await createNewChat();
			setIsInitialized(true);
			setInput('');
			setUploadName(null);
		} catch (error) {
			console.error('Error creating new chat:', error);
		} finally {
			// Reset the flag after a short delay
			setTimeout(() => setIsCreatingSession(false), 200);
		}
	};

	// Switch to a different chat session
	const handleSwitchToSession = (sessionId: string) => {
		switchToSession(sessionId);
		setInput('');
		setUploadName(null);
	};

	// Delete a chat session
	const handleDeleteSession = async (sessionId: string) => {
		if (chatSessions.length === 1) return; // Don't delete the last session
		try {
			await deleteSession(sessionId);
		} catch (error) {
			console.error('Error deleting session:', error);
		}
	};

	// Update session title based on first user message
	const handleUpdateSessionTitle = async (sessionId: string, firstUserMessage: string) => {
		console.log('=== CHAT PAGE: Updating session title ===', { sessionId, firstUserMessage });
		try {
			// Create a meaningful title from the user's message
			let newTitle = firstUserMessage.trim();
			
			// If it's an image upload, create a descriptive title
			if (newTitle.startsWith('[📷 Image:')) {
				newTitle = `Image: ${uploadName || 'Upload'}`;
			}
			
			// Truncate if too long and add ellipsis
			if (newTitle.length > 30) {
				newTitle = newTitle.slice(0, 30) + '...';
			}
			
			// Ensure we have a valid title
			if (!newTitle || newTitle.trim() === '') {
				newTitle = 'New Chat';
			}
			
			await updateSessionTitle(sessionId, newTitle);
			console.log('✅ Session title updated to:', newTitle);
		} catch (error) {
			console.error('Error updating session title:', error);
		}
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
			await handleCreateNewChat();
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
		
		setIsSending(true);
		const userMsg: Omit<any, 'timestamp'> = { 
			role: 'user', 
			content: text || (uploadedImage ? `[📷 Image: ${uploadName}]` : ''),
			imageData: uploadedImage || undefined,
			imageName: uploadName || undefined,
			isImageQuestion: uploadedImage ? true : undefined
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

		// Add user message to Firestore only if there's actual content
		// Skip empty messages when generating random questions
		if (text.trim() || uploadedImage) {
			try {
				await addMessageToCurrentSession(userMsg);
			} catch (error) {
				console.error('Error adding user message:', error);
				setIsSending(false);
				return;
			}
		}

		// Clear input and image after successful send
		setInput('');
		clearImage();

		// Update session title if this is the first user message and we have text content
		if (text.trim() && currentSession.messages.length <= 1) {
			await handleUpdateSessionTitle(currentSessionId, text);
		}

		// Check if user input contains an exam question and track progress
		if (text.trim()) {
			try {
				// Simple detection for exam-related questions
				const isExamQuestion = text.toLowerCase().includes('exam') || 
					text.toLowerCase().includes('question') || 
					text.toLowerCase().includes('solve') ||
					text.toLowerCase().includes('calculate') ||
					text.toLowerCase().includes('find') ||
					text.toLowerCase().includes('work out');

				if (isExamQuestion) {
					const questionData = {
						questionId: `user-${Date.now()}`,
						questionText: text.trim(),
						examBoard: 'User Question',
						year: new Date().getFullYear(),
						paper: 'Chat',
						questionNumber: '1',
						category: 'User Question',
						marks: 1,
						difficulty: 'Foundation' as const,
						topic: 'General',
						sessionId: currentSessionId,
						status: 'asked' as const
					};

					// Add to progress tracking
					await addProgressQuestion(questionData);
					console.log('✅ User question added to progress tracking:', questionData.questionId);
				}
			} catch (progressError) {
				console.error('Error adding user question to progress:', progressError);
			}
		}

		// Prepare the API request
		const requestBody: any = {
			message: text || (uploadedImage ? `[📷 Image: ${uploadName}]` : ''),
			model: selectedModel
		};

		if (uploadedImage) {
			requestBody.imageData = uploadedImage;
			requestBody.imageName = uploadName;
		}

		try {
			console.log('🚀 Sending API request:', { ...requestBody, imageData: uploadedImage ? '[BASE64_DATA]' : 'none' });
			
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody)
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			console.log('✅ API response received:', data);

			// Handle random question generation if no text was sent
			if (!text.trim() && data.randomQuestion && data.isRandomGenerated) {
				console.log('🎲 Random question generated:', data.randomQuestion);
				
				// Extract question text from various possible fields
				let questionText = '';
				if (data.randomQuestion.question) {
					questionText = data.randomQuestion.question;
				} else if (data.randomQuestion.text) {
					questionText = data.randomQuestion.text;
				} else if (data.randomQuestion.content) {
					questionText = data.randomQuestion.content;
				} else if (data.randomQuestion.problem) {
					questionText = data.randomQuestion.problem;
				} else if (typeof data.randomQuestion === 'string') {
					questionText = data.randomQuestion;
				}
				
				console.log('🔍 Extracted question text:', questionText);
				console.log('🔍 Full randomQuestion object:', JSON.stringify(data.randomQuestion, null, 2));
				
				// Add the random question as a user message to the chat dialog FIRST
				const randomQuestionMsg: Omit<any, 'timestamp'> = {
					role: 'user',
					content: questionText || 'Random Question'
				};
				
				try {
					await addMessageToCurrentSession(randomQuestionMsg);
					console.log('✅ Random question added as user message to chat');
				} catch (addError) {
					console.error('Error adding random question message:', addError);
				}
				
				// Update session title with the random question
				try {
					let newTitle = questionText;
					
					// If we still don't have a title, try to create one from other fields
					if (!newTitle || newTitle.trim() === '') {
						if (data.randomQuestion.topic) {
							newTitle = `${data.randomQuestion.topic} Question`;
						} else if (data.randomQuestion.category) {
							newTitle = `${data.randomQuestion.category} Question`;
						} else if (data.randomQuestion.difficulty) {
							newTitle = `${data.randomQuestion.difficulty} Level Question`;
						} else if (data.randomQuestion.examBoard) {
							newTitle = `${data.randomQuestion.examBoard} Question`;
						} else {
							newTitle = 'Random Question';
						}
					}
					
					// Truncate if too long and add ellipsis
					if (newTitle.length > 30) {
						newTitle = newTitle.slice(0, 30) + '...';
					}
					
					// Ensure we have a valid title
					if (!newTitle || newTitle.trim() === '') {
						newTitle = 'Random Question';
					}
					
					await updateSessionTitle(currentSessionId, newTitle);
					console.log('✅ Random question session title updated to:', newTitle);
				} catch (titleError) {
					console.error('Error updating random question session title:', titleError);
				}
			}

			if (data.reply) {
				// Add assistant message to Firestore AFTER the user message
				const assistantMsg: Omit<any, 'timestamp'> = {
					role: 'assistant',
					content: data.reply,
					apiUsed: data.apiUsed,
					model: selectedModel // Add the selected model to the message
				};

				await addMessageToCurrentSession(assistantMsg);

				// Check if this is an exam question and track progress
				if (data.randomQuestion && data.isRandomGenerated) {
					try {
						console.log('🔍 Random question data received:', JSON.stringify(data.randomQuestion, null, 2));
						
						// Use the same enhanced question text extraction logic
						let questionText = '';
						if (data.randomQuestion.question) {
							questionText = data.randomQuestion.question;
						} else if (data.randomQuestion.text) {
							questionText = data.randomQuestion.text;
						} else if (data.randomQuestion.content) {
							questionText = data.randomQuestion.content;
						} else if (data.randomQuestion.problem) {
							questionText = data.randomQuestion.problem;
						} else if (typeof data.randomQuestion === 'string') {
							questionText = data.randomQuestion;
						}
						
						// If we still don't have question text, create a descriptive title
						if (!questionText || questionText.trim() === '') {
							if (data.randomQuestion.topic) {
								questionText = `${data.randomQuestion.topic} Question`;
							} else if (data.randomQuestion.category) {
								questionText = `${data.randomQuestion.category} Question`;
							} else if (data.randomQuestion.difficulty) {
								questionText = `${data.randomQuestion.difficulty} Level Question`;
							} else if (data.randomQuestion.examBoard) {
								questionText = `${data.randomQuestion.examBoard} Question`;
							} else {
								questionText = 'Random Question';
							}
						}
						
						console.log('📝 Extracted question text:', questionText);
						console.log('🏫 Exam board from API:', data.randomQuestion.examBoard);
						console.log('📅 Year from API:', data.randomQuestion.year);
						console.log('📄 Paper from API:', data.randomQuestion.paper);
						
						// Extract question details from the random question data
						const questionData = {
							questionId: data.randomQuestion.id || `random-${Date.now()}`,
							questionText: questionText,
							examBoard: data.randomQuestion.examBoard || 'General',
							year: data.randomQuestion.year || new Date().getFullYear(),
							paper: data.randomQuestion.paper || '1',
							questionNumber: data.randomQuestion.questionNumber || '1',
							category: data.randomQuestion.category || 'General',
							marks: data.randomQuestion.marks || 1,
							difficulty: data.randomQuestion.difficulty || 'Foundation',
							topic: data.randomQuestion.topic || 'General',
							sessionId: currentSessionId,
							status: 'asked' as const
						};
						
						console.log('💾 Question data to be saved:', JSON.stringify(questionData, null, 2));

						// Add to progress tracking
						await addProgressQuestion(questionData);
						console.log('✅ Question added to progress tracking:', questionData.questionId);
					} catch (progressError) {
						console.error('Error adding question to progress:', progressError);
					}
				}

				// Handle image questions - extract question text and update session title
				if (data.isImageQuestion && data.extractedQuestion) {
					try {
						console.log('📷 Image question detected:', data.extractedQuestion);
						
						// Update the user message content with the extracted question
						const extractedQuestionText = data.extractedQuestion;
						
						// Update the user message in Firestore with the extracted question text
						try {
							// Find the user message we just added and update it
							const updatedUserMsg = {
								...userMsg,
								content: extractedQuestionText,
								extractedFromImage: true,
								originalImageContent: userMsg.content
							};
							
							// Update the message in the current session
							const updatedMessages = currentSession.messages.map((msg, index) => {
								if (index === currentSession.messages.length - 2) { // User message is second to last
									return updatedUserMsg;
								}
								return msg;
							});
							
							// Update the session with the new messages
							await updateSessionMessages(currentSessionId, updatedMessages);
							console.log('✅ User message updated with extracted question text');
						} catch (updateError) {
							console.error('Error updating user message with extracted text:', updateError);
						}
						
						// Update session title with the extracted question
						if (currentSession.messages.length <= 1) {
							let newTitle = extractedQuestionText;
							
							// Truncate if too long and add ellipsis
							if (newTitle.length > 30) {
								newTitle = newTitle.slice(0, 30) + '...';
							}
							
							// Ensure we have a valid title
							if (!newTitle || newTitle.trim() === '') {
								newTitle = 'Image Question';
							}
							
							await updateSessionTitle(currentSessionId, newTitle);
							console.log('✅ Image question session title updated to:', newTitle);
						}

						// Check if this is an exam question and track progress
						if (data.examMetadata) {
							console.log('📋 Exam metadata found for image question:', data.examMetadata);
							
							const questionData = {
								questionId: data.examMetadata.id || `image-${Date.now()}`,
								questionText: extractedQuestionText,
								examBoard: data.examMetadata.examBoard || 'User Question',
								year: data.examMetadata.year || new Date().getFullYear(),
								paper: data.examMetadata.paper || 'Image',
								questionNumber: data.examMetadata.questionNumber || '1',
								category: data.examMetadata.category || 'User Question',
								marks: data.examMetadata.marks || 1,
								difficulty: data.examMetadata.difficulty || 'Foundation',
								topic: data.examMetadata.topic || 'General',
								sessionId: currentSessionId,
								status: 'asked' as const
							};

							// Add to progress tracking
							await addProgressQuestion(questionData);
							console.log('✅ Image question added to progress tracking:', questionData.questionId);
						} else {
							// No exam metadata, but still track as a user question
							const questionData = {
								questionId: `image-${Date.now()}`,
								questionText: extractedQuestionText,
								examBoard: 'User Question',
								year: new Date().getFullYear(),
								paper: 'Image',
								questionNumber: '1',
								category: 'User Question',
								marks: 1,
								difficulty: 'Foundation' as const,
								topic: 'General',
								sessionId: currentSessionId,
								status: 'asked' as const
							};

							// Add to progress tracking
							await addProgressQuestion(questionData);
							console.log('✅ Image question added to progress tracking:', questionData.questionId);
						}
					} catch (imageError) {
						console.error('Error handling image question:', imageError);
					}
				}
			}

		} catch (error) {
			console.error('❌ Error sending message:', error);
			
			// Add error message to chat
			const errorMsg: Omit<any, 'timestamp'> = {
				role: 'assistant',
				content: 'Sorry, I encountered an error while processing your request. Please try again.',
				apiUsed: 'Error Response'
			};

			try {
				await addMessageToCurrentSession(errorMsg);
			} catch (addError) {
				console.error('Error adding error message:', addError);
			}
		} finally {
			setIsSending(false);
		}
	};

	// Handle drag and drop for image upload
	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		const files = e.dataTransfer.files;
		if (files.length > 0) {
			const file = files[0];
			if (file.type.startsWith('image/')) {
				// Handle the file directly instead of creating a fake event
				if (file.size > 5 * 1024 * 1024) {
					alert('Image size must be less than 5MB');
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
		}
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
	};

	// Show loading state until we're on the client side
	if (!isClient) {
		return (
								<div className="min-h-screen bg-gray-50 flex items-center justify-center">
						<div className="text-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
							<p className="text-gray-600">Initializing...</p>
						</div>
					</div>
		);
	}

	// Show loading state until Firestore is ready
	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading chat...</p>
				</div>
			</div>
		);
	}

	// Show error state if there's an error
	if (error) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="text-red-500 mb-4">
						<MessageCircle className="w-16 h-16 mx-auto" />
					</div>
					<h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Chat</h3>
					<p className="text-gray-600 mb-4">{error}</p>
					<div className="space-y-2">
						<button 
							onClick={refreshSessions}
							className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 mr-2"
						>
							Retry
						</button>
						<button 
							onClick={createNewChat}
							className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
						>
							Create New Chat
						</button>
					</div>
				</div>
			</div>
		);
	}

	// Show fallback state if no sessions exist
	if (!isLoading && chatSessions.length === 0 && !currentSessionId) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="text-blue-500 mb-4">
						<MessageCircle className="w-16 h-16 mx-auto" />
					</div>
					<h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Mentara!</h3>
					<p className="text-gray-600 mb-4">No chat sessions found. Create your first chat to get started.</p>
					<button 
						onClick={createNewChat}
						className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
					>
						Create New Chat
					</button>
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
					onClearStorage={handleClearStorage}
				>
					{/* Chat History */}
					<div className="flex-1 overflow-y-auto">
						{/* Recent Chats Header */}
						<div className="mb-4">
							<h3 className="text-sm font-medium text-gray-700 mb-3 px-1">Recent Chats</h3>
						</div>
						
						{chatSessions.map((session: any, index: number) => (
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
										{new Date().toLocaleDateString('en-GB')}
									</div>
								</button>
								{currentSessionId === session.id && (
									<div className="flex space-x-1 mt-1 px-3">
										<button
											onClick={() => updateSessionTitle(session.id, session.messages?.find((m: any) => m.role === 'user')?.content || 'New Chat')}
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

				{/* Main Chat Area */}
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
									Current Model: <span className="font-medium text-blue-600">{selectedModel === 'gemini-2.5-pro' ? 'Gemini 2.5 Pro' : selectedModel === 'chatgpt-5' ? 'ChatGPT 5' : 'ChatGPT 4o'}</span>
								</div>
							</div>
						</div>
					</div>

					{/* Chat Messages Area */}
					<div className="flex-1 overflow-y-auto p-4">
						<div className="max-w-4xl mx-auto">
							{/* Chat Messages */}
							{messages.length > 0 && (
								<div className="space-y-4">
									{messages.map((message, index) => (
										<ChatMessage
											key={index}
											content={message.content}
											role={message.role}
											imageData={message.imageData}
											imageName={message.imageName}
											apiUsed={message.apiUsed}
											model={message.model} // Pass the model information
										/>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Chat Input Area */}
					<div className="border-t border-gray-200 bg-white p-4">
						<div className="max-w-4xl mx-auto">
							<div className="relative">
								{/* Image upload button */}
								<input
									type="file"
									ref={fileRef}
									accept="image/*"
									onChange={handleImageUpload}
									className="hidden"
								/>
								
								<button
									onClick={() => fileRef.current?.click()}
									className="absolute left-3 top-1/2 transform -translate-y-1/2 w-8 h-8 text-gray-400 hover:text-gray-600 transition-colors"
									title="Upload image"
								>
									<ImageIcon className="w-5 h-5" />
								</button>
								
								{/* Text input */}
								<input
									type="text"
									value={input}
									onChange={(e) => setInput(e.target.value)}
									onKeyPress={(e) => e.key === 'Enter' && send()}
									placeholder="Ask a question or upload an image and tell me about it."
									className="w-full pl-12 pr-20 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
								/>
								
												{/* Send button */}
				<button
					onClick={send}
					disabled={false}
					className="absolute right-3 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md bg-primary-600 hover:bg-primary-700 text-white"
					title="Send message"
				>
					<Send className="w-5 h-5" />
				</button>
							</div>
							
							{/* Display uploaded image */}
							{uploadedImage && (
								<div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-3">
											<img 
												src={uploadedImage} 
												alt="Uploaded" 
												className="w-16 h-16 object-cover rounded-lg"
											/>
											<div>
												<p className="text-sm font-medium text-gray-900">{uploadName}</p>
												<p className="text-xs text-gray-500">Image uploaded successfully</p>
											</div>
										</div>
										<button
											onClick={clearImage}
											className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
											title="Remove image"
										>
											<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
											</svg>
										</button>
									</div>
								</div>
							)}

						</div>
					</div>
				</main>
			</div>
		</div>
	);
}
