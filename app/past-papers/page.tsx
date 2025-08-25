'use client';

import { useState, useEffect, useRef } from 'react';
import { examPaperService } from '@/services/examPaperService';
import { useProgress } from '@/hooks/useProgress';
import LeftSidebar from '@/components/LeftSidebar';
import DrawingPad, { DrawingPadRef } from '@/components/DrawingPad';
import dynamic from 'next/dynamic';

interface ChatSession {
	id: string;
	title: string;
	messages: Array<{
		role: 'user' | 'assistant';
		content: string;
	}>;
	timestamp: Date;
}

interface QuestionAnswer {
	questionId: string;
	textAnswer: string;
	imageData?: string;
	aiFeedback?: string;
	isLoadingFeedback: boolean;
}

const ChatHistory = dynamic(() => import('@/components/ChatHistory'), { 
	ssr: false,
	loading: () => (
		<div className="mb-4 p-3 bg-gray-50 rounded-lg">
			<div className="flex items-center space-x-2">
				<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
				<span className="text-sm text-gray-500">Loading...</span>
			</div>
		</div>
	)
});

export default function PastPapersPage() {
	const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
	const [isHydrated, setIsHydrated] = useState(false);
	const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);
	const [questionAnswers, setQuestionAnswers] = useState<Record<string, QuestionAnswer>>({});
	const [showPracticeMode, setShowPracticeMode] = useState(false);
	const [currentPracticeQuestion, setCurrentPracticeQuestion] = useState<any | null>(null);
	const [practiceAnswers, setPracticeAnswers] = useState<Record<string, QuestionAnswer>>({});
	const drawingPadRef = useRef<DrawingPadRef>(null);
	const [pastExamQuestions, setPastExamQuestions] = useState<any[]>([]);
	const [examPapers, setExamPapers] = useState<any[]>([]);

	// Load data from exam paper service
	useEffect(() => {
		const loadData = async () => {
			try {
				const [questions, papers] = await Promise.all([
					examPaperService.getAllPastExamQuestions(),
					examPaperService.getAllExamPapers()
				]);
				setPastExamQuestions(questions);
				setExamPapers(papers);
			} catch (error) {
				console.error('Error loading exam data:', error);
			}
		};
		loadData();
	}, []);

	// Load chat sessions from localStorage with enhanced error handling
	useEffect(() => {
		if (typeof window !== 'undefined') {
			try {
				const saved = localStorage.getItem('chatSessions');
				
				if (saved && saved.trim() !== '' && saved !== 'null') {
					const parsed = JSON.parse(saved);
					
					// Verify the data structure and preserve titles
					const validatedSessions = parsed.map((session: any) => ({
						...session,
						title: session.title || 'New Chat', // Ensure title is always present
						messages: Array.isArray(session.messages) ? session.messages : [],
						timestamp: session.timestamp ? new Date(session.timestamp) : new Date()
					}));
					
					setChatSessions(validatedSessions);
				} else {
					setChatSessions([]);
				}
			} catch (error) {
				console.error('Error loading chat sessions:', error);
				setChatSessions([]);
			}
			setIsHydrated(true);
		}
	}, []);

	const handlePracticeQuestion = (question: any) => {
		setCurrentPracticeQuestion(question);
		setShowPracticeMode(true);
		// Initialize answer for this question
		if (!practiceAnswers[question.id]) {
			setPracticeAnswers(prev => ({
				...prev,
				[question.id]: {
					questionId: question.id,
					textAnswer: '',
					imageData: undefined,
					aiFeedback: undefined,
					isLoadingFeedback: false
				}
			}));
		}
	};

	const captureNotepadImage = (questionId: string): string | null => {
		if (drawingPadRef.current) {
			return drawingPadRef.current.captureImage();
		}
		return null;
	};

	const getAIFeedback = async (questionId: string, question: any, textAnswer: string, imageData?: string) => {
		setPracticeAnswers(prev => ({
			...prev,
			[questionId]: {
				...prev[questionId],
				isLoadingFeedback: true
			}
		}));

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					message: `Please provide feedback on this GCSE Maths answer. 

Question: ${question.question}
Student's answer: ${textAnswer || 'No text answer provided'}
Question details: ${question.marks} marks, ${question.difficulty} tier, ${question.topic}

Please provide:
1. A brief assessment of the answer
2. Specific feedback on what's good and what could be improved
3. A suggested approach or working method
4. The correct answer with explanation

Keep the feedback encouraging and constructive for a GCSE student.`,
					imageData: imageData,
					imageName: `notepad-${questionId}.png`
				}),
			});

			if (response.ok) {
				const data = await response.json();
				setPracticeAnswers(prev => ({
					...prev,
					[questionId]: {
						...prev[questionId],
						aiFeedback: data.reply || data.response || 'AI feedback could not be generated.',
						isLoadingFeedback: false
					}
				}));
			} else {
				throw new Error('Failed to get AI feedback');
			}
		} catch (error) {
			console.error('Error getting AI feedback:', error);
			setPracticeAnswers(prev => ({
				...prev,
				[questionId]: {
					...prev[questionId],
					aiFeedback: 'Sorry, AI feedback could not be generated at this time. Please try again later.',
					isLoadingFeedback: false
				}
			}));
		}
	};

	const submitAnswer = async (questionId: string) => {
		const question = currentPracticeQuestion;
		const answer = practiceAnswers[questionId];
		
		if (!question || !answer) return;

		// Capture notepad image if available
		const imageData = captureNotepadImage(questionId);
		
		// Update answer with image data
		setPracticeAnswers(prev => ({
			...prev,
			[questionId]: {
				...prev[questionId],
				imageData: imageData || undefined
			}
		}));

		// Get AI feedback
		await getAIFeedback(questionId, question, answer.textAnswer, imageData || undefined);
	};

	const updateTextAnswer = (questionId: string, textAnswer: string) => {
		setPracticeAnswers(prev => ({
			...prev,
			[questionId]: {
				...prev[questionId],
				textAnswer
			}
		}));
	};

	if (showPracticeMode && currentPracticeQuestion) {
		const currentAnswer = practiceAnswers[currentPracticeQuestion.id] || {
			questionId: currentPracticeQuestion.id,
			textAnswer: '',
			imageData: undefined,
			aiFeedback: undefined,
			isLoadingFeedback: false
		};

		return (
			<div className="min-h-screen bg-gray-50">
				<div className="flex h-screen">
					<LeftSidebar>
						<ChatHistory chatSessions={chatSessions} />
					</LeftSidebar>
					<main className="flex-1 flex flex-col">
						<div className="flex-1 overflow-y-auto p-4">
							<div className="max-w-6xl mx-auto">
								{/* Header */}
								<div className="mb-6">
									<button
										onClick={() => setShowPracticeMode(false)}
										className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
									>
										<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
										</svg>
										Back to Past Papers
									</button>
									<h1 className="text-2xl font-bold text-gray-900">Practice Question</h1>
									<div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
										<div className="text-sm text-blue-800">
											<strong>{currentPracticeQuestion.examBoard} {currentPracticeQuestion.year} {currentPracticeQuestion.paper}</strong> • 
											Question {currentPracticeQuestion.questionNumber} • 
											{currentPracticeQuestion.marks} marks • 
											{currentPracticeQuestion.difficulty} tier • 
											{currentPracticeQuestion.topic}
										</div>
									</div>
								</div>

								<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
									{/* Question and Answer Section */}
									<div className="space-y-6">
										{/* Question */}
										<div className="card">
											<h2 className="text-lg font-semibold text-gray-900 mb-4">Question</h2>
											<p className="text-gray-700 text-lg">{currentPracticeQuestion.question}</p>
										</div>

										{/* Answer Input */}
										<div className="card">
											<h3 className="text-lg font-semibold text-gray-900 mb-4">Your Answer</h3>
											
											{/* Text Answer */}
											<div className="mb-4">
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Text Answer (Optional)
												</label>
												<textarea
													value={currentAnswer.textAnswer}
													onChange={(e) => updateTextAnswer(currentPracticeQuestion.id, e.target.value)}
													className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
													rows={3}
													placeholder="Type your answer here (optional)..."
												/>
											</div>

											{/* Notepad */}
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Working/Diagram Notepad
												</label>
												<DrawingPad ref={drawingPadRef} className="h-64 border border-gray-300 rounded-lg" />
											</div>

											{/* Submit Button */}
											<div className="mt-4">
												<button
													onClick={() => submitAnswer(currentPracticeQuestion.id)}
													disabled={currentAnswer.isLoadingFeedback}
													className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
												>
													{currentAnswer.isLoadingFeedback ? (
														<div className="flex items-center justify-center">
															<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
															Getting AI Feedback...
														</div>
													) : (
														'Submit Answer & Get AI Feedback'
													)}
												</button>
											</div>
										</div>
									</div>

									{/* AI Feedback Section */}
									<div className="space-y-6">
										{/* AI Feedback */}
										{currentAnswer.aiFeedback && (
											<div className="card">
												<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
													<svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
													</svg>
													AI Feedback
												</h3>
												<div className="prose prose-sm max-w-none">
													<div className="whitespace-pre-wrap text-gray-700">
														{currentAnswer.aiFeedback}
													</div>
												</div>
											</div>
										)}

										{/* Question Metadata */}
										<div className="card">
											<h3 className="text-lg font-semibold text-gray-900 mb-4">Question Details</h3>
											<div className="space-y-3 text-sm">
												<div className="flex justify-between">
													<span className="text-gray-600">Exam Board:</span>
													<span className="font-medium">{currentPracticeQuestion.examBoard}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-gray-600">Year:</span>
													<span className="font-medium">{currentPracticeQuestion.year}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-gray-600">Paper:</span>
													<span className="font-medium">{currentPracticeQuestion.paper}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-gray-600">Question:</span>
													<span className="font-medium">{currentPracticeQuestion.questionNumber}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-gray-600">Category:</span>
													<span className="font-medium">{currentPracticeQuestion.category}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-gray-600">Marks:</span>
													<span className="font-medium">{currentPracticeQuestion.marks}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-gray-600">Difficulty:</span>
													<span className="font-medium">{currentPracticeQuestion.difficulty}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-gray-600">Topic:</span>
													<span className="font-medium">{currentPracticeQuestion.topic}</span>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</main>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="flex h-screen">
				{/* Left Sidebar */}
				<LeftSidebar>
					<ChatHistory chatSessions={chatSessions} />
				</LeftSidebar>

				{/* Main Content */}
				<main className="flex-1 flex flex-col">
					<div className="flex-1 overflow-y-auto p-4">
						<div className="max-w-7xl mx-auto">
							{/* Header */}
							<div className="mb-8">
								<h1 className="text-3xl font-bold text-gray-900">Past Papers</h1>
								<p className="text-gray-600 mt-2">Practice with real GCSE Maths exam papers and individual questions</p>
							</div>

							{/* Quick Practice Section */}
							<div className="mb-8">
								<div className="card">
									<h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Practice Questions</h2>
									<p className="text-gray-600 mb-4">Practice individual questions from past papers with AI feedback</p>
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
										{pastExamQuestions.slice(0, 6).map((question) => (
											<div key={question.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
												<p className="text-sm text-gray-700 mb-3 line-clamp-3">{question.question}</p>
												<div className="flex items-center justify-between text-xs text-gray-500 mb-3">
													<span>{question.examBoard} {question.year}</span>
													<span>{question.marks} marks</span>
												</div>
												<button
													onClick={() => handlePracticeQuestion(question)}
													className="w-full btn-secondary text-sm py-2"
												>
													Practice This Question
												</button>
											</div>
										))}
									</div>
									<div className="mt-4 text-center">
										<button
											onClick={() => {
												const randomQuestion = pastExamQuestions[Math.floor(Math.random() * pastExamQuestions.length)];
												handlePracticeQuestion(randomQuestion);
											}}
											className="btn-primary"
										>
											Practice Random Question
										</button>
									</div>
								</div>
							</div>

							{/* Exam Papers Grid */}
							<div className="mb-8">
								<h2 className="text-xl font-semibold text-gray-900 mb-4">Full Exam Papers</h2>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
									{examPapers.map((exam) => (
										<div key={exam.id} className="card hover:shadow-md transition-shadow cursor-pointer">
											<div className="flex items-start justify-between mb-4">
												<div className="flex-1">
													<h3 className="text-lg font-semibold text-gray-900 mb-2">{exam.title}</h3>
													<p className="text-sm text-gray-600 mb-3">{exam.examBoard} • {exam.paperType}</p>
													
													<div className="flex items-center space-x-4 mb-3">
														<span className={`px-2 py-1 text-xs font-medium rounded-full ${
															exam.level === 'A-Level' 
																? 'bg-orange-100 text-orange-800' 
																: 'bg-green-100 text-green-800'
														}`}>
															{exam.level}
														</span>
														<span className={`px-2 py-1 text-xs font-medium rounded-full ${
															exam.difficulty === 'foundation' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
														}`}>
															{exam.difficulty} tier
														</span>
														<div className="flex items-center space-x-2 text-sm text-gray-500">
															<span>{exam.timeLimit}m</span>
														</div>
													</div>
												</div>
												<div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
													<svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
													</svg>
												</div>
											</div>

											{/* Exam Details */}
											<div className="space-y-3">
												<div className="flex items-center justify-between text-sm">
													<span className="text-gray-600">Level</span>
													<span className="font-medium">{exam.level}</span>
												</div>
												<div className="flex items-center justify-between text-sm">
													<span className="text-gray-600">Total Marks</span>
													<span className="font-medium">{exam.totalMarks}</span>
												</div>
												<div className="flex items-center justify-between text-sm">
													<span className="text-gray-600">Questions</span>
													<span className="font-medium">{exam.questions.length}</span>
												</div>
												<div className="flex items-center justify-between text-sm">
													<span className="text-gray-600">Calculator</span>
													<span className="font-medium">{exam.calculator ? 'Allowed' : 'Not Allowed'}</span>
												</div>
											</div>

											{/* Action Button */}
											<div className="mt-6">
												<a
													href={`/exam/${exam.id}`}
													className="w-full btn-primary text-center"
												>
													Start Exam
												</a>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}
