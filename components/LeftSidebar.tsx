'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, MessageCircle, Plus, Trash2, HardDrive } from 'lucide-react';



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
	const [showStorageDetails, setShowStorageDetails] = useState(false);

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

			{/* Storage Management Section */}
			<div className="mt-auto pt-4 border-t border-gray-200">
				{/* Storage Info */}
				<div className="mb-3">
					<button
						onClick={() => setShowStorageDetails(!showStorageDetails)}
						className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
					>
						<div className="flex items-center space-x-2">
							<HardDrive className="w-4 h-4" />
							<span>Storage</span>
						</div>
						<span className="text-xs">
							{storageInfo ? `${storageInfo.totalSizeMB}MB` : '...'}
						</span>
					</button>
					
					{showStorageDetails && storageInfo && (
						<div className="px-3 py-2 mt-1 text-xs text-gray-500 bg-gray-50 rounded-lg">
							<div className="flex justify-between">
								<span>Total:</span>
								<span>{storageInfo.totalSize}KB</span>
							</div>
							<div className="flex justify-between">
								<span>Chat Data:</span>
								<span>{storageInfo.chatSize}KB</span>
							</div>
							{storageInfo.totalSizeMB > 3 && (
								<div className="text-orange-600 mt-1">
									⚠️ Storage getting full
								</div>
							)}
						</div>
					)}
				</div>

				{/* Clear Storage Button */}
				{onClearStorage && (
					<button
						onClick={onClearStorage}
						className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
					>
						<Trash2 className="w-4 h-4" />
						<span>Clear All Chats</span>
					</button>
				)}
			</div>
		</aside>
	);
}
