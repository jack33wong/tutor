'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminNavigation() {
  const pathname = usePathname();

  const adminLinks = [
    {
      href: '/admin/manage-exam-papers',
      label: 'Manage Exam Papers',
      description: 'Add, edit, and manage individual exam questions',
      icon: '📚'
    },
    {
      href: '/admin/bulk-import-questions',
      label: 'Bulk Import Questions',
      description: 'Import multiple questions from CSV, JSON, or manual entry',
      icon: '📥'
    },
    {
      href: '/admin/import-exam-papers',
      label: 'Import Exam Papers',
      description: 'Bulk import full exam papers to Firestore',
      icon: '🚀'
    },
    {
      href: '/debug-firestore',
      label: 'Debug Firestore',
      description: 'Inspect and verify Firestore data',
      icon: '🔍'
    },
    {
      href: '/test-detection',
      label: 'Test Detection',
      description: 'Test exam question detection logic',
      icon: '🧪'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🔧 Admin Tools</h2>
        <p className="text-gray-600">Manage exam papers, import questions, and debug the system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                isActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{link.icon}</div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${
                    isActive ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {link.label}
                  </h3>
                  <p className={`text-sm mt-1 ${
                    isActive ? 'text-blue-700' : 'text-gray-600'
                  }`}>
                    {link.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">💡 Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/manage-exam-papers"
            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
          >
            ➕ Add Question
          </Link>
          <Link
            href="/admin/bulk-import-questions"
            className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm hover:bg-green-200 transition-colors"
          >
            📊 Import CSV
          </Link>
          <Link
            href="/admin/import-exam-papers"
            className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm hover:bg-purple-200 transition-colors"
          >
            🚀 Sync Firestore
          </Link>
        </div>
      </div>
    </div>
  );
}
