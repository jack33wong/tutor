"use client";

import { useRef, useState } from 'react';
import { LayoutDashboard, Pencil, Send, Image as ImageIcon, FileText } from 'lucide-react';
import DrawingPad from '@/components/DrawingPad';
import MarkdownMessage from '@/components/MarkdownMessage';
import { useRouter } from 'next/navigation';

type ChatItem = { role: 'user' | 'assistant'; content: string };

export default function ChatHome() {
	const router = useRouter();
	const [messages, setMessages] = useState<ChatItem[]>([
		        { role: 'assistant', content: 'Hi! I can help with GCSE Maths using Mentara. Ask a question or upload an image and tell me about it.' },
	]);
	const [input, setInput] = useState('');
	const [uploadName, setUploadName] = useState<string | null>(null);
	const [showNotepad, setShowNotepad] = useState(false);
	const [isSending, setIsSending] = useState(false);
	const fileRef = useRef<HTMLInputElement | null>(null);

	const send = async () => {
		console.log('Send function called');
		const text = input.trim();
		console.log('Input text:', text);
		if (!text) {
			console.log('No text to send');
			return;
		}
		setIsSending(true);
		console.log('Setting isSending to true');
		const userMsg: ChatItem = { role: 'user', content: text + (uploadName ? `\n(Attached: ${uploadName})` : '') };
		console.log('User message:', userMsg);
		setMessages(prev => [...prev, userMsg]);
		setInput('');
		try {
			console.log('Making API request to /api/chat');
			const resp = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: text, imageName: uploadName || undefined }),
			});
			console.log('API response status:', resp.status);
			const data = await resp.json();
			console.log('API response data:', data);
			const reply = data?.reply || 'Sorry, I could not respond right now.';
			console.log('Setting assistant message:', reply);
			setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
		} catch (e) {
			console.error('Error in send function:', e);
			setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Please try again.' }]);
		} finally {
			console.log('Setting isSending to false');
			setIsSending(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="flex h-screen">
				{/* Sidebar */}
				<aside className="w-64 bg-white border-r border-gray-200 p-4 hidden md:flex md:flex-col">
					                <h2 className="text-lg font-semibold text-gray-900 mb-4">Mentara</h2>
					<nav className="space-y-2">
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
					
					{/* Notepad Section */}
					<div className="mt-auto space-y-4">
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
					<header className="bg-white border-b border-gray-200 p-4">
						                <h1 className="text-xl font-bold text-gray-900">Mentara</h1>
						<p className="text-sm text-gray-600">Ask questions, attach an image (optional), and jot notes in the notepad.</p>
					</header>

					<div className="flex-1 overflow-y-auto p-4 space-y-4">
						{messages.map((m, idx) => (
							<div key={idx} className={`max-w-2xl ${m.role === 'user' ? 'ml-auto' : ''}`}>
								<div className={`px-4 py-3 rounded-lg text-sm ${m.role === 'user' ? 'bg-primary-600 text-white whitespace-pre-wrap' : 'bg-white border border-gray-200 text-gray-900'}`}>
									{m.role === 'user' ? (
										m.content
									) : (
										<MarkdownMessage content={m.content} />
									)}
								</div>
							</div>
						))}
					</div>

					{/* Input Bar */}
					<div className="border-t border-gray-200 bg-white p-3">
						<div className="max-w-3xl mx-auto flex items-end space-x-2">
							<button
								onClick={() => fileRef.current?.click()}
								className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700"
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
									const f = e.target.files?.[0];
									setUploadName(f ? f.name : null);
								}}
							/>
							<div className="flex-1">
								<textarea
									value={input}
									onChange={(e) => setInput(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter' && !e.shiftKey) {
											e.preventDefault();
											console.log('Enter key pressed');
											send();
										}
									}}
									rows={1}
									placeholder={uploadName ? `Message (attached: ${uploadName})` : 'Message Mentara...'}
									className="w-full resize-none px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
								/>
							</div>
							<button
								disabled={isSending}
								onClick={() => {
									console.log('Send button clicked');
									send();
								}}
								className="p-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50"
								title="Send"
							>
								<Send className="w-5 h-5" />
							</button>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}
