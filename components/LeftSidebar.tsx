'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, MessageCircle, Plus, Trash2, HardDrive, TrendingUp, CheckSquare, Settings, Database, FileSpreadsheet, Search, Bug, Type } from 'lucide-react';
import ProgressDisplay from './ProgressDisplay';


interface LeftSidebarProps {
	children?: React.ReactNode;
	onNewChat?: () => void;
	onClearStorage?: () => void;
	storageInfo?: {
		totalSize: number;
		chatSize: number;
		totalSizeMB: number;
	} | null;
}

export default function LeftSidebar({ children, onNewChat, onClearStorage, storageInfo }: LeftSidebarProps) {
	const pathname = usePathname();
	const [showAdminMenu, setShowAdminMenu] = useState(false);

	const handleChatClick = (e: React.MouseEvent) => {
		if (onNewChat && pathname === '/') {
			e.preventDefault();
			onNewChat();
		}
	};

	const adminMenuItems = [
		{
			href: '/admin',
			label: 'Admin Dashboard',
			icon: Settings,
			description: 'Main admin panel'
		},
		{
			href: '/admin/manage-exam-papers',
			label: 'Manage Questions',
			icon: FileText,
			description: 'Add/edit exam questions'
		},
		{
			href: '/admin/bulk-import-questions',
			label: 'Bulk Import',
			icon: FileSpreadsheet,
			description: 'Import from CSV/JSON'
		},
		{
			href: '/admin/import-exam-papers',
			label: 'Sync Database',
			icon: Database,
			description: 'Sync with Firestore'
		},
		{
			href: '/debug-firestore',
			label: 'Debug Data',
			icon: Bug,
			description: 'Inspect Firestore'
		},
		{
			href: '/test-detection',
			label: 'Test Detection',
			icon: Search,
			description: 'Test question matching'
		}
	];

	return (
		<aside className="w-64 bg-white border-r border-gray-200 p-4 hidden md:flex md:flex-col">
			{/* Header Label */}
			<h2 className="text-lg font-semibold text-gray-900 mb-4">Mentara</h2>
			
			{/* Navigation Menu */}
			<nav className="mb-6">
				<Link
					href="/"
					onClick={handleChatClick}
					className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
						pathname === '/'
							? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
							: 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
					}`}
				>
					<Plus className="w-4 h-4" />
					<span>New Chat</span>
				</Link>
				
				<Link
					href="/progress"
					className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 mt-2 ${
						pathname === '/progress'
							? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
							: 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
					}`}
				>
					<TrendingUp className="w-4 h-4" />
					<span>Progress</span>
				</Link>

				<Link
					href="/mark-homework"
					className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 mt-2 ${
						pathname === '/mark-homework'
							? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
							: 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
					}`}
				>
					<CheckSquare className="w-4 h-4" />
					<span>Homework</span>
				</Link>

				{/* LaTeX Demo - Temporarily disabled
				<Link
					href="/latex-demo"
					className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 mt-2 ${
						pathname === '/latex-demo'
							? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
							: 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
					}`}
				>
					<Type className="w-4 h-4" />
					<span>LaTeX Demo</span>
				</Link>
				*/}
			</nav>

			{/* Progress Display */}
			<div className="mb-4">
				<ProgressDisplay />
			</div>

			{/* Chat History - Show on all pages */}
			{children && (
				<div className="flex-1 overflow-y-auto">
					{children}
				</div>
			)}

			{/* Admin Menu Section */}
			<div className="mt-auto pt-4 border-t border-gray-200">
				{/* Admin Menu Toggle */}
				<div className="mb-3">
					<button
						onClick={() => setShowAdminMenu(!showAdminMenu)}
						className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
					>
						<div className="flex items-center space-x-2">
							<Settings className="w-4 h-4" />
							<span>Admin Tools</span>
						</div>
						<span className="text-xs">
							{showAdminMenu ? '▼' : '▶'}
						</span>
					</button>
					
					{/* Admin Menu Items */}
					{showAdminMenu && (
						<div className="space-y-1 mt-2">
							{adminMenuItems.map((item) => {
								const IconComponent = item.icon;
								const isActive = pathname === item.href;
								return (
									<Link
										key={item.href}
										href={item.href}
										className={`flex items-center space-x-2 px-3 py-2 text-xs rounded-lg transition-colors ${
											isActive
												? 'bg-blue-50 text-blue-700 border border-blue-200'
												: 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
										}`}
										title={item.description}
									>
										<IconComponent className="w-3 h-3" />
										<span className="truncate">{item.label}</span>
									</Link>
								);
							})}
						</div>
					)}
				</div>

				{/* Clear Storage Button - Keep this for now but make it smaller */}
				{onClearStorage && (
					<button
						onClick={onClearStorage}
						className="flex items-center space-x-2 w-full px-3 py-2 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
					>
						<Trash2 className="w-3 h-3" />
						<span>Clear All Chats</span>
					</button>
				)}
			</div>
		</aside>
	);
}
