'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
	ArrowLeft, 
	ArrowRight, 
	CheckCircle, 
	Flag, 
	Lightbulb,
	XCircle,
	MessageCircle,
	LayoutDashboard,
	FileText
} from 'lucide-react';
import { examPaperService } from '@/services/examPaperService';
import DrawingPad from '@/components/DrawingPad';
import LeftSidebar from '@/components/LeftSidebar';
import ChatHistory from '@/components/ChatHistory';

export default function ExamPage() {
	const router = useRouter();
	const [currentQuestion, setCurrentQuestion] = useState(0);
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
	const [showHints, setShowHints] = useState<Set<number>>(new Set());
	const [loadingHints, setLoadingHints] = useState<Set<number>>(new Set());
	const [aiHints, setAiHints] = useState<Record<number, string>>({});
	const [showResults, setShowResults] = useState(false);
	const [examStartTime, setExamStartTime] = useState<Date | null>(null);
	const [timeLeft, setTimeLeft] = useState(0);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [chatSessions, setChatSessions] = useState<Array<{
		id: string;
		title: string;
		messages: Array<{ role: 'user' | 'assistant'; content: string }>;
		timestamp: Date | string;
	}>>([]);

	// Get exam ID from URL
	const examId = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '';
	const [exam, setExam] = useState<any>(null);

	// Load exam data
	useEffect(() => {
		const loadExam = async () => {
			if (examId) {
				try {
					const examData = await examPaperService.getFullExamPaperById(examId);
					setExam(examData);
				} catch (error) {
					console.error('Error loading exam:', error);
				}
			}
		};
		loadExam();
	}, [examId]);

	// Load chat sessions from localStorage
	useEffect(() => {
		if (typeof window !== 'undefined') {
			try {
				const stored = localStorage.getItem('chatSessions');
				if (stored) {
					const parsed = JSON.parse(stored);
					setChatSessions(parsed);
				}
			} catch (error) {
				console.error('Error loading chat sessions:', error);
			}
		}
	}, []);

	useEffect(() => {
		if (exam && !examStartTime) {
			setExamStartTime(new Date());
		}
	}, [exam, examStartTime]);

	useEffect(() => {
		if (exam) {
			setTimeLeft(exam.timeLimit * 60); // Convert to seconds
			setExamStartTime(new Date());
		}
	}, [exam]);

	useEffect(() => {
		if (timeLeft > 0 && !isSubmitted) {
			const timer = setInterval(() => {
				setTimeLeft(prev => {
					if (prev <= 1) {
						handleSubmit();
						return 0;
					}
					return prev - 1;
				});
			}, 1000);

			return () => clearInterval(timer);
		}
	}, [timeLeft, isSubmitted]);

	if (!exam) {
		return (
			<div className="min-h-screen bg-gray-50">
				<div className="flex h-screen">
					<LeftSidebar>
						<ChatHistory chatSessions={[]} />
					</LeftSidebar>
					<main className="flex-1 flex items-center justify-center">
						<div className="text-center">
							<h1 className="text-2xl font-bold text-gray-900 mb-4">Exam not found</h1>
							<p className="text-gray-600">The exam you're looking for doesn't exist.</p>
						</div>
					</main>
				</div>
			</div>
		);
	}

	const handleAnswerChange = (questionId: string, answer: string) => {
		setAnswers(prev => ({
			...prev,
			[questionId]: answer
		}));
	};

	const handleSubmit = () => {
		setIsSubmitted(true);
		setShowResults(true);
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	const toggleFlag = (questionIndex: number) => {
		setFlaggedQuestions(prev => {
			const newSet = new Set(prev);
			if (newSet.has(questionIndex)) {
				newSet.delete(questionIndex);
			} else {
				newSet.add(questionIndex);
			}
			return newSet;
		});
	};

	const toggleHint = async (questionIndex: number) => {
		if (showHints.has(questionIndex)) {
			setShowHints(prev => {
				const newSet = new Set(prev);
				newSet.delete(questionIndex);
				return newSet;
			});
		} else {
			setShowHints(prev => {
				const newSet = new Set(prev);
				newSet.add(questionIndex);
				return newSet;
			});
			
			// Fetch AI hint if we don't have one yet
			if (!aiHints[questionIndex]) {
				await fetchAIHint(questionIndex);
			}
		}
	};

	const fetchAIHint = async (questionIndex: number) => {
		const question = exam.questions[questionIndex];
		if (!question) return;

		setLoadingHints(prev => {
			const newSet = new Set(prev);
			newSet.add(questionIndex);
			return newSet;
		});

		try {
			const resp = await fetch('/api/hint', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					question: question.question,
					studentAnswer: answers[question.id] || '',
					options: question.options,
					type: question.questionType,
					marks: question.marks,
					topic: question.topic,
					subtopic: question.subtopic,
					difficulty: question.difficulty
				}),
			});
			
			if (resp.ok) {
				const data = await resp.json();
				setAiHints(prev => ({
					...prev,
					[questionIndex]: data.hint || 'Try breaking the problem into smaller steps and check each carefully.'
				}));
			} else {
				setAiHints(prev => ({
					...prev,
					[questionIndex]: 'Try breaking the problem into smaller steps and check each carefully.'
				}));
			}
		} catch (e) {
			setAiHints(prev => ({
				...prev,
				[questionIndex]: 'Try breaking the problem into smaller steps and check each carefully.'
			}));
		} finally {
			setLoadingHints(prev => {
				const newSet = new Set(prev);
				newSet.delete(questionIndex);
				return newSet;
			});
		}
	};

	const currentQ = exam.questions[currentQuestion];
	const answeredQuestions = Object.keys(answers).length;
	const totalQuestions = exam.questions.length;

	if (showResults) {
		return <ExamResults exam={exam} answers={answers} startTime={examStartTime} chatSessions={chatSessions} />;
	}

	const renderAnswerInput = (question: any) => {
		switch (question.questionType) {
			case 'multiple-choice':
				return (
					<div className="space-y-3">
						{question.options?.map((option: any, index: number) => (
							<label key={index} className="flex items-center space-x-3 cursor-pointer">
								<input
									type="radio"
									name={question.id}
									value={option}
									checked={answers[question.id] === option}
									onChange={(e) => handleAnswerChange(question.id, e.target.value)}
									className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
								/>
								<span className="text-gray-700">{option}</span>
							</label>
						))}
					</div>
				);
			
			case 'short-answer':
				return (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<input
							type="text"
							value={answers[question.id] || ''}
							onChange={(e) => handleAnswerChange(question.id, e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
							placeholder="Enter your answer..."
						/>
						<div>
							<p className="text-sm font-medium text-gray-700 mb-2">Notepad</p>
							<DrawingPad className="h-64 border border-gray-300 rounded-lg" />
						</div>
					</div>
				);
			
			case 'long-answer':
				return (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<textarea
							value={answers[question.id] || ''}
							onChange={(e) => handleAnswerChange(question.id, e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
							rows={6}
							placeholder="Show your working and answer here..."
						/>
						<div>
							<p className="text-sm font-medium text-gray-700 mb-2">Notepad</p>
							<DrawingPad className="h-64 md:h-full border border-gray-300 rounded-lg" />
						</div>
					</div>
				);
			
			default:
				return (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<textarea
							value={answers[question.id] || ''}
							onChange={(e) => handleAnswerChange(question.id, e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
							rows={4}
							placeholder="Enter your answer..."
						/>
						<div>
							<p className="text-sm font-medium text-gray-700 mb-2">Notepad</p>
							<DrawingPad className="h-64 border border-gray-300 rounded-lg" />
						</div>
					</div>
				);
		}
		return null; // Default return for switch statement
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="flex h-screen">
				<LeftSidebar>
					<ChatHistory chatSessions={chatSessions} />
				</LeftSidebar>
				<main className="flex-1 flex flex-col">
					<div className="flex-1 overflow-y-auto p-4">
						<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
							{/* Question Area */}
							<div className="lg:col-span-3">
								<motion.div
									key={currentQuestion}
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									className="card"
								>
									{/* Question Header */}
									<div className="flex items-center justify-between mb-6">
										<div className="flex items-center space-x-4">
											<span className="text-2xl font-bold text-primary-600">Q{currentQuestion + 1}</span>
											<span className="text-sm text-gray-500">{currentQ.marks} marks</span>
											<span className={`px-2 py-1 text-xs font-medium rounded-full ${
												currentQ.questionType === 'multiple-choice' ? 'bg-blue-100 text-blue-800' :
												currentQ.questionType === 'short-answer' ? 'bg-green-100 text-green-800' :
												currentQ.questionType === 'long-answer' ? 'bg-purple-100 text-purple-800' :
												'bg-orange-100 text-orange-800'
											}`}>
												{currentQ.questionType.replace('-', ' ')}
											</span>
										</div>
										<div className="flex items-center space-x-2">
											<button
												onClick={() => toggleHint(currentQuestion)}
												className={`p-2 rounded-lg transition-colors ${
													showHints.has(currentQuestion)
														? 'bg-yellow-100 text-yellow-600'
														: 'bg-gray-100 text-gray-400 hover:bg-gray-200'
												}`}
												title="Show hints"
											>
												<Lightbulb className="w-5 h-5" />
											</button>
											<button
												onClick={() => toggleFlag(currentQuestion)}
												className={`p-2 rounded-lg transition-colors ${
													flaggedQuestions.has(currentQuestion)
														? 'bg-yellow-100 text-yellow-600'
														: 'bg-gray-100 text-gray-400 hover:bg-gray-200'
												}`}
												title="Flag for review"
											>
												<Flag className="w-5 h-5" />
											</button>
										</div>
									</div>

									{/* Question */}
									<div className="mb-8">
										<p className="text-lg text-gray-900 mb-4">{currentQ.question}</p>
										
										{/* AI Hints */}
										{showHints.has(currentQuestion) && (
											<div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
												<h4 className="font-medium text-yellow-800 mb-2 flex items-center">
													<Lightbulb className="w-4 h-4 mr-2" />
													AI Hint
												</h4>
												<div className="text-sm text-yellow-700">
													{loadingHints.has(currentQuestion) ? (
														<div className="flex items-center space-x-2">
															<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
															<span>Generating hint...</span>
														</div>
													) : (
														<p>{aiHints[currentQuestion] || 'Click the hint button to get AI-powered help!'}</p>
													)}
												</div>
											</div>
										)}
										
										{/* Answer Input */}
										<div className="space-y-4">
											<label className="block">
												<span className="text-sm font-medium text-gray-700">Your Answer</span>
												<div className="mt-2">
													{renderAnswerInput(currentQ)}
												</div>
											</label>
										</div>
									</div>

									{/* Navigation */}
									<div className="flex items-center justify-between pt-6 border-t border-gray-200">
										<button
											onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
											disabled={currentQuestion === 0}
											className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											<ArrowLeft className="w-4 h-4" />
											<span>Previous</span>
										</button>

										<div className="flex items-center space-x-2">
											{currentQuestion < totalQuestions - 1 ? (
												<button
													onClick={() => setCurrentQuestion(prev => prev + 1)}
													className="btn-primary flex items-center space-x-2"
												>
													<span>Next</span>
													<ArrowRight className="w-4 h-4" />
												</button>
											) : (
												<button
													onClick={handleSubmit}
													className="btn-primary flex items-center space-x-2"
												>
													<CheckCircle className="w-4 h-4" />
													<span>Submit Exam</span>
												</button>
											)}
										</div>
									</div>
								</motion.div>
							</div>

							{/* Question Navigator */}
							<div className="lg:col-span-1">
								<div className="card">
									<h3 className="text-lg font-semibold text-gray-900 mb-4">Question Navigator</h3>
									
									<div className="grid grid-cols-5 gap-2 mb-6">
										{exam.questions.map((question: any, index: number) => {
											const isAnswered = answers[question.id];
											const isFlagged = flaggedQuestions.has(index);
											const isCurrent = index === currentQuestion;
											
											return (
												<button
													key={index}
													onClick={() => setCurrentQuestion(index)}
													className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors relative ${
														isCurrent
															? 'bg-primary-600 text-white'
															: isAnswered
															? 'bg-success-100 text-success-800'
															: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
													}`}
												>
													{index + 1}
													{isFlagged && (
														<Flag className="w-3 h-3 absolute -top-1 -right-1 text-yellow-600" />
													)}
												</button>
											);
										})}
									</div>

									<div className="space-y-3 text-sm">
										<div className="flex items-center space-x-2">
											<div className="w-4 h-4 bg-primary-600 rounded"></div>
											<span>Current</span>
										</div>
										<div className="flex items-center space-x-2">
											<div className="w-4 h-4 bg-success-100 rounded"></div>
											<span>Answered</span>
										</div>
										<div className="flex items-center space-x-2">
											<div className="w-4 h-4 bg-gray-100 rounded"></div>
											<span>Unanswered</span>
										</div>
									</div>

									{/* Exam Info */}
									<div className="mt-6 pt-4 border-t border-gray-100">
										<div className="space-y-2 text-sm">
											<div className="flex items-center justify-between">
												<span className="text-gray-600">Level</span>
												<span className={`px-2 py-1 text-xs font-medium rounded-full ${
													exam.level === 'A-Level' 
														? 'bg-orange-100 text-orange-800' 
														: 'bg-green-100 text-green-800'
												}`}>
													{exam.level}
												</span>
											</div>
											<div className="flex items-center justify-between">
												<span className="text-gray-600">Total Marks</span>
												<span className="font-medium">{exam.totalMarks}</span>
											</div>
											<div className="flex items-center justify-between">
												<span className="text-gray-600">Time Limit</span>
												<span className="font-medium">{exam.timeLimit}m</span>
											</div>
											<div className="flex items-center justify-between">
												<span className="text-gray-600">Difficulty</span>
												<span className={`px-2 py-1 text-xs font-medium rounded-full ${
													exam.difficulty === 'foundation' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
												}`}>
													{exam.difficulty}
												</span>
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

function ExamResults({ exam, answers, startTime, chatSessions }: { exam: any, answers: Record<string, string>, startTime: Date | null, chatSessions: Array<{ id: string; title: string; messages: Array<{ role: 'user' | 'assistant'; content: string }>; timestamp: Date | string }> }) {
	const router = useRouter();
	
	const calculateScore = () => {
		let totalScore = 0;
		let totalMarks = 0;
		
		exam.questions.forEach((question: any) => {
			totalMarks += question.marks;
			const userAnswer = answers[question.id];
			if (userAnswer && userAnswer.trim().toLowerCase() === question.correctAnswer.toString().toLowerCase()) {
				totalScore += question.marks;
			}
		});
		
		return { score: totalScore, totalMarks, percentage: (totalScore / totalMarks) * 100 };
	};

	const { score, totalMarks, percentage } = calculateScore();
	const examDuration = startTime ? Math.round((new Date().getTime() - startTime.getTime()) / 60000) : 0;

	const getGrade = (percentage: number) => {
		if (percentage >= 90) return '9';
		if (percentage >= 80) return '8';
		if (percentage >= 70) return '7';
		if (percentage >= 60) return '6';
		if (percentage >= 50) return '5';
		if (percentage >= 40) return '4';
		if (percentage >= 30) return '3';
		if (percentage >= 20) return '2';
		return '1';
	};

	const grade = getGrade(percentage);

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="flex h-screen">
				<LeftSidebar>
					<ChatHistory chatSessions={chatSessions} />
				</LeftSidebar>
				<main className="flex-1 flex flex-col">
					<div className="flex-1 overflow-y-auto p-4">
						<div className="max-w-4xl mx-auto">
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								className="card"
							>
								<div className="text-center mb-8">
									<h1 className="text-3xl font-bold text-gray-900 mb-4">Exam Results</h1>
									<p className="text-lg text-gray-600">{exam.title}</p>
									<div className="flex items-center justify-center space-x-4 mt-2 text-sm text-gray-500">
										<span>{exam.examBoard} {exam.paperType}</span>
										<span>•</span>
										<span>{exam.level}</span>
										<span>•</span>
										<span>{exam.difficulty} tier</span>
										<span>•</span>
										<span>{examDuration} minutes</span>
									</div>
								</div>

								{/* Score Summary */}
								<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
									<div className="text-center">
										<p className="text-2xl font-bold text-primary-600">{score}</p>
										<p className="text-sm text-gray-500">Score</p>
									</div>
									<div className="text-center">
										<p className="text-2xl font-bold text-gray-900">{totalMarks}</p>
										<p className="text-sm text-gray-500">Total Marks</p>
									</div>
									<div className="text-center">
										<p className="text-2xl font-bold text-success-600">{percentage.toFixed(1)}%</p>
										<p className="text-sm text-gray-500">Percentage</p>
									</div>
									<div className="text-center">
										<p className="text-2xl font-bold text-purple-600">Grade {grade}</p>
										<p className="text-sm text-gray-500">Grade</p>
									</div>
								</div>

								{/* Question Review */}
								<div className="space-y-6">
									<h2 className="text-xl font-semibold text-gray-900">Question Review</h2>
									{exam.questions.map((question: any, index: number) => {
										const userAnswer = answers[question.id];
										const isCorrect = userAnswer && userAnswer.trim().toLowerCase() === question.correctAnswer.toString().toLowerCase();
										
										return (
											<div key={question.id} className="border border-gray-200 rounded-lg p-4">
												<div className="flex items-start justify-between mb-3">
													<h3 className="font-medium text-gray-900">Question {index + 1}</h3>
													<div className="flex items-center space-x-2">
														{isCorrect ? (
															<CheckCircle className="w-5 h-5 text-success-600" />
														) : (
															<XCircle className="w-5 h-5 text-error-600" />
														)}
														<span className="text-sm text-gray-500">{question.marks} marks</span>
														<span className={`px-2 py-1 text-xs font-medium rounded-full ${
															question.questionType === 'multiple-choice' ? 'bg-blue-100 text-blue-800' :
															question.questionType === 'short-answer' ? 'bg-green-100 text-green-800' :
															question.questionType === 'long-answer' ? 'bg-purple-100 text-purple-800' :
															'bg-orange-100 text-orange-800'
														}`}>
															{question.questionType.replace('-', ' ')}
														</span>
													</div>
												</div>
												
												<p className="text-gray-700 mb-3">{question.question}</p>
												
												<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
													<div>
														<p className="text-sm font-medium text-gray-600 mb-1">Your Answer:</p>
														<p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
															{userAnswer || 'No answer provided'}
														</p>
													</div>
													<div>
														<p className="text-sm font-medium text-gray-600 mb-1">Correct Answer:</p>
														<p className="text-sm text-gray-900 bg-success-50 p-2 rounded">
															{question.correctAnswer}
														</p>
													</div>
												</div>
												
												{question.explanation && (
													<div className="mt-3">
														<p className="text-sm font-medium text-gray-600 mb-1">Explanation:</p>
														<p className="text-sm text-gray-700 bg-blue-50 p-3 rounded">
															{question.explanation}
														</p>
													</div>
												)}

												{question.working && (
													<div className="mt-3">
														<p className="text-sm font-medium text-gray-600 mb-1">Working:</p>
														<p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded font-mono whitespace-pre-line">
															{question.working}
														</p>
													</div>
												)}
											</div>
										);
									})}
								</div>

								{/* Actions */}
								<div className="flex items-center justify-center space-x-4 mt-8 pt-6 border-t border-gray-200">
									<button
										onClick={() => router.push('/')}
										className="btn-primary"
									>
										Return to Dashboard
									</button>
									<button
										onClick={() => router.push('/past-papers')}
										className="btn-secondary"
									>
										View All Exams
									</button>
									<button
										onClick={() => window.location.reload()}
										className="btn-secondary"
									>
										Retake Exam
									</button>
								</div>
							</motion.div>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}
