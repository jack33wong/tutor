"use client";

import { useRef, useState, useEffect } from 'react';
import { LayoutDashboard, Pencil, Send, Image as ImageIcon, FileText, Plus, MessageCircle, Trash2 } from 'lucide-react';
import DrawingPad from '@/components/DrawingPad';
import MarkdownMessage from '@/components/MarkdownMessage';
import GeometryDiagram from '@/components/GeometryDiagram';
import { useRouter } from 'next/navigation';

type ChatItem = { role: 'user' | 'assistant'; content: string };
type ChatSession = {
	id: string;
	title: string;
	messages: ChatItem[];
	timestamp: Date;
	geometryData?: any;
};

export default function ChatHome() {
	const router = useRouter();
	const [chatSessions, setChatSessions] = useState<ChatSession[]>([
		{
			id: 'geometry-test',
			title: 'Geometry Test - Semicircle Proof',
			messages: [
				{
					role: 'assistant',
					content: 'I\'m ready to help with geometry problems. I\'ll provide responses in strict JSON format for diagram instructions. Click the "Load Geometry Question" button below to test the semicircle proof question.'
				}
			],
			timestamp: new Date(),
			geometryData: null
		}
	]);
	const [currentSessionId, setCurrentSessionId] = useState<string>('geometry-test');
	const [input, setInput] = useState('');
	const [uploadName, setUploadName] = useState<string | null>(null);
	const [showNotepad, setShowNotepad] = useState(false);
	const [isSending, setIsSending] = useState(false);
	const fileRef = useRef<HTMLInputElement | null>(null);

	// Get current session
	const currentSession = chatSessions.find(session => session.id === currentSessionId);
	const messages = currentSession?.messages || [];
	const geometryData = currentSession?.geometryData || null;

	// Check if current session is a geometry test session
	const isGeometrySession = currentSessionId === 'geometry-test';

	// Create new chat session
	const createNewChat = () => {
		const newSession: ChatSession = {
			id: Date.now().toString(),
			title: 'New Chat',
			messages: [{ role: 'assistant', content: 'Hi! I can help with GCSE Maths using Mentara. Ask a question or upload an image and tell me about it.' }],
			timestamp: new Date(),
			geometryData: null
		};
		setChatSessions(prev => [newSession, ...prev]);
		setCurrentSessionId(newSession.id);
		setInput('');
		setUploadName(null);
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
		if (sessionId === 'geometry-test') return; // Don't delete the geometry test session
		setChatSessions(prev => prev.filter(session => session.id !== sessionId));
		if (currentSessionId === sessionId) {
			const remainingSessions = chatSessions.filter(session => session.id !== sessionId);
			setCurrentSessionId(remainingSessions[0].id);
		}
	};

	// Update session title based on first user message
	const updateSessionTitle = (sessionId: string, firstUserMessage: string) => {
		setChatSessions(prev => prev.map(session => 
			session.id === sessionId 
				? { ...session, title: firstUserMessage.slice(0, 30) + (firstUserMessage.length > 30 ? '...' : '') }
				: session
		));
	};

	const send = async () => {
		if (!input.trim() && !uploadName) return;
		
		const userMessage = { role: 'user' as const, content: input };
		const currentSession = chatSessions.find(s => s.id === currentSessionId);
		
		if (currentSession) {
			const updatedSession = {
				...currentSession,
				messages: [...currentSession.messages, userMessage]
			};
			
			setChatSessions(prev => prev.map(s => s.id === currentSessionId ? updatedSession : s));
		}
		
		setInput('');
		setUploadName(null);
		
		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: [...(currentSession?.messages || []), userMessage],
					isGeometryRequest: isGeometrySession
				})
			});
			
			const data = await response.json();
			const reply = data?.reply || 'Sorry, I could not respond right now.';
			
			// Parse geometry data if this is a geometry session
			let parsedGeometryData = null;
			if (isGeometrySession) {
				try {
					parsedGeometryData = JSON.parse(reply);
				} catch (error) {
					console.error('Failed to parse geometry JSON:', error);
				}
			}
			
			// Add assistant reply and geometry data to current session
			setChatSessions(prev => prev.map(session => 
				session.id === currentSessionId 
					? { ...session, messages: [...session.messages, { role: 'assistant', content: reply }], geometryData: parsedGeometryData }
					: session
			));
		} catch (e) {
			console.error('Error in send function:', e);
			setChatSessions(prev => prev.map(session => 
				session.id === currentSessionId 
					? { ...session, messages: [...session.messages, { role: 'assistant', content: 'Network error. Please try again.' }], geometryData: null }
					: session
			));
		} finally {
			console.log('Setting isSending to false');
			setIsSending(false);
		}
	};



	// Save chat sessions to localStorage
	useEffect(() => {
		localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
	}, [chatSessions]);

	// Load chat sessions from localStorage on mount
	useEffect(() => {
		const saved = localStorage.getItem('chatSessions');
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				// Convert timestamp strings back to Date objects
				const sessionsWithDates = parsed.map((session: any) => ({
					...session,
					timestamp: new Date(session.timestamp)
				}));
				setChatSessions(sessionsWithDates);
			} catch (e) {
				console.error('Error loading chat sessions:', e);
			}
		}
	}, []);

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="flex h-screen">
				{/* Sidebar */}
				<aside className="w-64 bg-white border-r border-gray-200 p-4 hidden md:flex md:flex-col">
					<h2 className="text-lg font-semibold text-gray-900 mb-4">Mentara</h2>
					
					{/* Navigation */}
					<nav className="space-y-2 mb-6">
						<button
							onClick={() => router.push('/dashboard')}
							className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100"
						>
							<LayoutDashboard className="w-4 h-4" />
							<span>Dashboard</span>
						</button>
						<button
							onClick={() => router.push('/past-papers')}
							className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100"
						>
							<FileText className="w-4 h-4" />
							<span>Past Papers</span>
						</button>
					</nav>
					
					{/* New Chat Button */}
					<button
						onClick={createNewChat}
						className="w-full flex items-center justify-start space-x-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200 mb-6"
					>
						<Plus className="w-5 h-5 flex-shrink-0" />
						<span className="text-sm font-semibold">New Chat</span>
					</button>

					{/* Chat History */}
					<div className="flex-1 overflow-y-auto">
						<div className="space-y-1">
							{chatSessions.map((session) => (
								<div
									key={session.id}
									className={`group relative flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
										currentSessionId === session.id
											? 'bg-primary-100 text-primary-700'
											: 'hover:bg-gray-100 text-gray-700'
									}`}
									onClick={() => switchToSession(session.id)}
								>
									<MessageCircle className="w-4 h-4 flex-shrink-0" />
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium truncate">{session.title}</p>
										<p className="text-xs text-gray-500 truncate">
											{session.timestamp.toLocaleDateString('en-GB', { 
												day: 'numeric', 
												month: 'short',
												hour: '2-digit',
												minute: '2-digit'
											})}
										</p>
									</div>
									{chatSessions.length > 1 && (
										<button
											onClick={(e) => {
												e.stopPropagation();
												deleteSession(session.id);
											}}
											className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
										>
											<Trash2 className="w-3 h-3 text-red-500" />
										</button>
									)}
								</div>
							))}
						</div>
					</div>

					{/* Notepad Section */}
					<div className="mt-4 space-y-4">
						<button
							onClick={() => setShowNotepad(v => !v)}
							className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800"
						>
							<Pencil className="w-4 h-4" />
							<span>{showNotepad ? 'Hide' : 'Open'} Notepad</span>
						</button>
						{showNotepad && (
							<div className="mt-3 h-56">
								<DrawingPad className="h-full border border-gray-300 rounded-lg" />
							</div>
						)}
					</div>
				</aside>

				{/* Chat Area */}
				<main className="flex-1 flex flex-col">
					{/* Centered Conversation Area */}
					<div className="flex-1 overflow-y-auto">
						<div className="max-w-4xl mx-auto px-4 py-6">
							{messages.map((m, idx) => (
								<div key={idx} className={`mb-6 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
									<div className={`inline-block max-w-3xl ${m.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
										<div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
											m.role === 'user' 
												? 'bg-primary-600 text-white' 
												: 'bg-white border border-gray-200 text-gray-900 shadow-sm'
										}`}>
											{m.role === 'user' ? (
												<div className="whitespace-pre-wrap">{m.content}</div>
											) : (
												<MarkdownMessage content={m.content} isGeometryResponse={isGeometrySession} />
											)}
										</div>
									</div>
								</div>
							))}
							
							{/* Geometry Diagram */}
							{isGeometrySession && geometryData && (
								<div className="mt-6">
									<h3 className="text-lg font-semibold mb-4">Geometry Diagram</h3>
									<GeometryDiagram geometryData={geometryData} />
								</div>
							)}
						</div>
					</div>

					{/* Geometry Test Section */}
					{isGeometrySession && (
						<div className="mb-6 p-4 bg-blue-50 rounded-lg">
							<div className="flex flex-wrap gap-3">
								<button
									onClick={() => {
										setInput('I want to prove that the angle inside a semi-circle is always right angle. The present diagram contain a circle with centre C and a triangle QRS with QR side as diameter already drawn. What extra line should be drawn to help me prove the statement. No need for full prove just where to draw the line');
									}}
									className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
								>
									Load Geometry Question
								</button>
							</div>
						</div>
					)}

					{/* Input Bar */}
					<div className="border-t border-gray-200 bg-white p-6">
						<div className="max-w-4xl mx-auto">
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
									onChange={(e) => {
										const file = e.target.files?.[0];
										if (file) {
											setUploadName(file.name);
										}
									}}
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
									placeholder="Ask questions, attach an image (optional), and jot notes in the notepad"
									className="w-full px-12 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none bg-white"
								/>
								
								{/* Send button on the right */}
								<button
									onClick={send}
									disabled={!input.trim() && !uploadName}
									className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
								>
									<Send className="w-5 h-5" />
								</button>
							</div>
							
							{/* Upload name display */}
							{uploadName && (
								<div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
									<ImageIcon className="w-4 h-4" />
									<span>{uploadName}</span>
									<button
										onClick={() => setUploadName(null)}
										className="text-red-500 hover:text-red-700"
									>
										×
									</button>
								</div>
							)}
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}
