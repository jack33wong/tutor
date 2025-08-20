'use client';

import { useState, useEffect } from 'react';
import { examPapers } from '@/data/examPapers';
import { sampleUserProgress } from '@/data/userProgress';
import LeftSidebar from '@/components/LeftSidebar';
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

const ChatHistory = dynamic(() => import('@/components/ChatHistory'), { 
	ssr: false,
	loading: () => (
		<div className="mb-6 border-4 border-blue-500 p-4 bg-blue-50">
			<h3 className="text-sm font-medium text-gray-700 mb-3">Loading Chat History...</h3>
			<div className="animate-pulse space-y-2">
				<div className="h-4 bg-blue-200 rounded"></div>
				<div className="h-4 bg-blue-200 rounded w-3/4"></div>
			</div>
		</div>
	)
});

export default function PastPapersPage() {
	const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
	const [isHydrated, setIsHydrated] = useState(false);



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
								<p className="text-gray-600 mt-2">Practice with real GCSE Maths exam papers</p>
								

							</div>

							{/* Exam Papers Grid */}
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{examPapers.map((exam) => (
									<div key={exam.id} className="card hover:shadow-md transition-shadow cursor-pointer">
										<div className="flex items-start justify-between mb-4">
											<div className="flex-1">
												<h3 className="text-lg font-semibold text-gray-900 mb-2">{exam.title}</h3>
												<p className="text-sm text-gray-600 mb-3">{exam.examBoard} • {exam.paperType}</p>
												
												<div className="flex items-center space-x-4 mb-3">
													<span className={`px-2 py-1 text-xs font-medium rounded-full ${
														exam.difficulty === 'foundation' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
													}`}>
														{exam.difficulty} tier
													</span>
													<div className="flex items-center text-sm text-gray-500">
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
				</main>
			</div>
		</div>
	);
}
