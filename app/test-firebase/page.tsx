"use client";

import { useState, useEffect } from 'react';
import { firestoreService } from '@/services/firestoreService';

export default function TestFirebase() {
  const [status, setStatus] = useState('Loading...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function testConnection() {
      try {
        setStatus('Testing Firebase connection...');
        
        // Test basic connection
        const sessions = await firestoreService.getChatSessions();
        setStatus(`✅ Firebase connected! Found ${sessions.length} sessions`);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setStatus('❌ Firebase connection failed');
        console.error('Firebase test error:', err);
      }
    }

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Firebase Connection Test</h1>
        <p className="text-lg mb-4">{status}</p>
        {error && (
          <div className="text-red-600 bg-red-100 p-4 rounded-lg">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
