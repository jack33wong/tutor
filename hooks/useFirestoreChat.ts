import { useState, useEffect, useCallback, useMemo } from 'react';
import { firestoreService, ChatSession, ChatItem, CreateChatSessionData } from '@/services/firestoreService';
import { Timestamp } from 'firebase/firestore';

export interface UseFirestoreChatReturn {
  chatSessions: ChatSession[];
  currentSessionId: string | null;
  isLoading: boolean;
  error: string | null;
  createNewChat: () => Promise<string>;
  switchToSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  addMessageToCurrentSession: (message: Omit<ChatItem, 'timestamp'>) => Promise<void>;
  clearAllSessions: () => Promise<void>;
  refreshSessions: () => Promise<void>;
}

export function useFirestoreChat(userId?: string): UseFirestoreChatReturn {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load chat sessions from Firestore
  const loadChatSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const sessions = await firestoreService.getChatSessions(userId);
      setChatSessions(sessions);
      
      // Set current session to the most recent one if none is selected
      if (sessions.length > 0 && !currentSessionId) {
        setCurrentSessionId(sessions[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat sessions');
      console.error('Error loading chat sessions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Create a new chat session
  const createNewChat = useCallback(async (): Promise<string> => {
    if (!isClient) {
      throw new Error('Cannot create chat session during SSR');
    }
    
    try {
      setError(null);
      
      const sessionData: CreateChatSessionData = {
        title: 'New Chat',
        messages: [],
        userId
      };

      const newSessionId = await firestoreService.createChatSession(sessionData);
      
      // Add the new session to the local state
      const newSession: ChatSession = {
        id: newSessionId,
        title: sessionData.title,
        messages: sessionData.messages,
        timestamp: Timestamp.now(),
        userId
      };

      setChatSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSessionId);
      
      return newSessionId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create new chat';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [userId, isClient]);

  // Switch to a different chat session
  const switchToSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
  }, []);

  // Update session title
  const updateSessionTitle = useCallback(async (sessionId: string, title: string) => {
    try {
      setError(null);
      await firestoreService.updateChatSession(sessionId, { title });
      
      // Update local state
      setChatSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, title }
            : session
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update session title';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Delete a chat session
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      setError(null);
      await firestoreService.deleteChatSession(sessionId);
      
      // Remove from local state
      setChatSessions(prev => prev.filter(session => session.id !== sessionId));
      
      // If we deleted the current session, switch to another one
      if (currentSessionId === sessionId) {
        const remainingSessions = chatSessions.filter(session => session.id !== sessionId);
        if (remainingSessions.length > 0) {
          setCurrentSessionId(remainingSessions[0].id);
        } else {
          setCurrentSessionId(null);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete session';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [currentSessionId, chatSessions]);

  // Add a message to the current session
  const addMessageToCurrentSession = useCallback(async (message: Omit<ChatItem, 'timestamp'>) => {
    if (!isClient) {
      throw new Error('Cannot add message during SSR');
    }
    
    if (!currentSessionId) {
      throw new Error('No active chat session');
    }

    try {
      setError(null);
      await firestoreService.addMessageToSession(currentSessionId, message);
      
      // Update local state
      const newMessage: ChatItem = {
        ...message,
        timestamp: Timestamp.now()
      };

      setChatSessions(prev => 
        prev.map(session => 
          session.id === currentSessionId
            ? { ...session, messages: [...session.messages, newMessage] }
            : session
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add message';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [currentSessionId, isClient]);

  // Clear all chat sessions
  const clearAllSessions = useCallback(async () => {
    try {
      setError(null);
      await firestoreService.clearAllSessions(userId);
      setChatSessions([]);
      setCurrentSessionId(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear sessions';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [userId]);

  // Refresh sessions from Firestore
  const refreshSessions = useCallback(async () => {
    await loadChatSessions();
  }, [loadChatSessions]);

  // Load sessions on mount and when userId changes
  useEffect(() => {
    if (isClient) {
      loadChatSessions();
    }
  }, [loadChatSessions, isClient]);

  // Initialize with a default session if none exist
  useEffect(() => {
    if (isClient && !isLoading && chatSessions.length === 0 && !currentSessionId) {
      console.log('🆕 No existing sessions, creating default session...');
      createNewChat().catch(err => {
        console.error('Failed to create default session:', err);
        setError(`Failed to initialize chat: ${err.message}`);
      });
    }
  }, [isClient, isLoading, chatSessions.length, currentSessionId, createNewChat]);

  return {
    chatSessions,
    currentSessionId,
    isLoading,
    error,
    createNewChat,
    switchToSession,
    updateSessionTitle,
    deleteSession,
    addMessageToCurrentSession,
    clearAllSessions,
    refreshSessions
  };
}
