'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, MessageCircle, Plus } from 'lucide-react';



interface LeftSidebarProps {
	children?: React.ReactNode;
	onNewChat?: () => void;
}

export default function LeftSidebar({ children, onNewChat }: LeftSidebarProps) {
	const pathname = usePathname();

	const handleChatClick = (e: React.MouseEvent) => {
		if (onNewChat && pathname === '/') {
			e.preventDefault();
			onNewChat();
		}
	};

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
					href="/dashboard"
					className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 mt-2 ${
						pathname === '/dashboard'
							? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
							: 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
					}`}
				>
					<LayoutDashboard className="w-4 h-4" />
					<span>Dashboard</span>
				</Link>
				<Link
					href="/past-papers"
					className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 mt-2 ${
						pathname === '/past-papers'
							? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
							: 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
					}`}
				>
					<FileText className="w-4 h-4" />
					<span>Past Papers</span>
				</Link>
			</nav>

			{/* Chat History - Show on all pages */}
			{children && (
				<div className="flex-1 overflow-y-auto">
					{children}
				</div>
			)}
		</aside>
	);
}
