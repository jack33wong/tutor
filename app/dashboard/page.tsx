'use client';

import { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, TrendingUp, Clock, Target, MessageCircle } from 'lucide-react';
import ProgressCard from '@/components/ProgressCard';
import ExamCard from '@/components/ExamCard';
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

export default function DashboardPage() {
	const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
	const [isHydrated, setIsHydrated] = useState(false);

	// Debug function to check localStorage state
	const debugLocalStorage = () => {
		if (typeof window === 'undefined') return;
		
		try {
			const saved = localStorage.getItem('chatSessions');
			console.log('=== DASHBOARD: DEBUG localStorage ===');
			console.log('=== DASHBOARD: Raw localStorage value ===', saved);
			
			if (saved && saved.trim() !== '' && saved !== 'null') {
				const parsed = JSON.parse(saved);
				console.log('=== DASHBOARD: Parsed localStorage ===', parsed);
				console.log('=== DASHBOARD: Current state vs localStorage ===', {
					stateSessionsCount: chatSessions.length,
					localStorageSessionsCount: parsed.length,
					stateFirstSessionTitle: chatSessions[0]?.title || 'No sessions',
					localStorageFirstSessionTitle: parsed[0]?.title || 'No sessions',
					stateFirstSessionMessagesCount: chatSessions[0]?.messages?.length || 0,
					localStorageFirstSessionMessagesCount: parsed[0]?.messages?.length || 0
				});
			} else {
				console.log('=== DASHBOARD: No localStorage data found ===');
			}
		} catch (error) {
			console.error('=== DASHBOARD: DEBUG localStorage error ===', error);
		}
	};

	// Load chat sessions from localStorage with enhanced error handling
	useEffect(() => {
		if (typeof window !== 'undefined') {
			try {
				const saved = localStorage.getItem('chatSessions');
				console.log('=== DASHBOARD: Loading chat sessions from localStorage ===', { saved });
				
				if (saved && saved.trim() !== '' && saved !== 'null') {
					const parsed = JSON.parse(saved);
					console.log('=== DASHBOARD: Parsed chat sessions ===', parsed);
					
					// Verify the data structure and preserve titles
					const validatedSessions = parsed.map((session: any) => ({
						...session,
						title: session.title || 'New Chat', // Ensure title is always present
						messages: Array.isArray(session.messages) ? session.messages : [],
						timestamp: session.timestamp ? new Date(session.timestamp) : new Date()
					}));
					
					console.log('=== DASHBOARD: Validated and set chat sessions ===', validatedSessions);
					setChatSessions(validatedSessions);
				} else {
					console.log('=== DASHBOARD: No chat sessions found in localStorage ===');
					setChatSessions([]);
				}
			} catch (error) {
				console.error('=== DASHBOARD: Error loading chat sessions ===', error);
				setChatSessions([]);
			}
			setIsHydrated(true);
		}
	}, []);

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="flex h-screen">
				{/* Left Sidebar */}
				<LeftSidebar chatSessions={chatSessions}>
					<ChatHistory chatSessions={chatSessions} />
				</LeftSidebar>

				{/* Main Content */}
				<main className="flex-1 flex flex-col">
					<div className="flex-1 overflow-y-auto p-4">
						<div className="max-w-7xl mx-auto">
							{/* Header */}
							<div className="mb-8">
								<h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
								<p className="text-gray-600 mt-2">Track your progress and recent activities</p>
								
								{/* Debug localStorage button */}
								<div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
									<div className="flex items-center justify-between">
										<span className="text-sm text-blue-800">Debug: localStorage State</span>
										<button
											onClick={debugLocalStorage}
											className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
										>
											Check State
										</button>
									</div>
									<div className="text-xs text-blue-600 mt-1">
										Chat Sessions: {chatSessions.length} | Hydrated: {isHydrated ? 'Yes' : 'No'}
									</div>
								</div>
							</div>

							{/* Progress Overview */}
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
								<ProgressCard
									title="Overall Progress"
									value={75}
									icon={TrendingUp}
									color="primary"
									subtitle="Based on completed topics and practice questions"
								/>
								<ProgressCard
									title="Exam Performance"
									value={82}
									icon={Target}
									color="success"
									subtitle="Average score across all past papers"
								/>
								<ProgressCard
									title="Study Time"
									value={60}
									icon={Clock}
									color="warning"
									subtitle="Hours spent studying this month"
								/>
							</div>

							{/* Recent Exams */}
							<div className="mb-8">
								<h2 className="text-2xl font-semibold text-gray-900 mb-4">Recent Exams</h2>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
									<div className="card">
										<h3 className="text-lg font-semibold text-gray-900 mb-2">Paper 1 - Foundation</h3>
										<p className="text-sm text-gray-600 mb-2">AQA • 15/05/2023</p>
										<div className="text-2xl font-bold text-primary-600">85/80</div>
										<div className="text-sm text-gray-500">Foundation tier</div>
									</div>
									<div className="card">
										<h3 className="text-lg font-semibold text-gray-900 mb-2">Paper 2 - Higher</h3>
										<p className="text-sm text-gray-600 mb-2">Edexcel • 20/04/2023</p>
										<div className="text-2xl font-bold text-primary-600">78/100</div>
										<div className="text-sm text-gray-500">Higher tier</div>
									</div>
									<div className="card">
										<h3 className="text-lg font-semibold text-gray-900 mb-2">Paper 3 - Foundation</h3>
										<p className="text-sm text-gray-600 mb-2">OCR • 10/03/2023</p>
										<div className="text-2xl font-bold text-primary-600">92/80</div>
										<div className="text-sm text-gray-500">Foundation tier</div>
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
