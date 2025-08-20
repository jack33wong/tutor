'use client';

import { LayoutDashboard, FileText, TrendingUp, Clock, Target, MessageCircle } from 'lucide-react';
import ProgressCard from '@/components/ProgressCard';
import ExamCard from '@/components/ExamCard';
import LeftSidebar from '@/components/LeftSidebar';
import dynamic from 'next/dynamic';

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
	return (
		<div className="min-h-screen bg-gray-50">
			<div className="flex h-screen">
				{/* Left Sidebar */}
				<LeftSidebar>
					<ChatHistory />
				</LeftSidebar>

				{/* Main Content */}
				<main className="flex-1 flex flex-col">
					<div className="flex-1 overflow-y-auto p-4">
						<div className="max-w-7xl mx-auto">
							{/* Header */}
							<div className="mb-8">
								<h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
								<p className="text-gray-600 mt-2">Track your progress and recent activities</p>
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
