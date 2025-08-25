import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  where,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db, initializeFirebase } from '@/config/firebase';

export interface ChatItem {
  role: 'user' | 'assistant';
  content: string;
  imageData?: string;
  imageName?: string;
  apiUsed?: string;
  model?: string; // Add model field to track which AI model was used
  timestamp: Timestamp;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatItem[];
  timestamp: Timestamp;
  userId?: string; // For future user authentication
}

export interface CreateChatSessionData {
  title: string;
  messages: ChatItem[];
  userId?: string;
}

export interface UpdateChatSessionData {
  title?: string;
  messages?: ChatItem[];
}

class FirestoreService {
  private readonly COLLECTION_NAME = 'chatSessions';

  // Check if Firestore is available
  private async checkFirestore(): Promise<void> {
    if (!db) {
      // Try to initialize Firebase if not already done
      if (typeof window !== 'undefined') {
        initializeFirebase();
        // Wait a bit for initialization
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (!db) {
        throw new Error('Firestore not initialized. This function can only run on the client side.');
      }
    }
  }

  // Create a new chat session
  async createChatSession(data: CreateChatSessionData): Promise<string> {
    await this.checkFirestore();
    
    try {
      // Filter out undefined values and create clean session data
      const sessionData: any = {
        title: data.title,
        messages: data.messages.map(msg => {
          // Filter out undefined values and ensure all required fields are present
          const cleanMessage: any = {
            role: msg.role || 'user',
            content: msg.content || '',
            timestamp: Timestamp.now()
          };
          
          // Only add optional fields if they have valid values
          if (msg.imageData) cleanMessage.imageData = msg.imageData;
          if (msg.imageName) cleanMessage.imageName = msg.imageName;
          if (msg.apiUsed) cleanMessage.apiUsed = msg.apiUsed;
          if (msg.model) cleanMessage.model = msg.model; // Ensure model is preserved
          
          return cleanMessage;
        }),
        timestamp: serverTimestamp()
      };
      
      // Only add userId if it's defined
      if (data.userId) {
        sessionData.userId = data.userId;
      }

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), sessionData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw new Error('Failed to create chat session');
    }
  }

  // Get all chat sessions for a user
  async getChatSessions(userId?: string, limitCount: number = 50): Promise<ChatSession[]> {
    await this.checkFirestore();
    
    try {
      console.log('🔍 Getting chat sessions for userId:', userId);
      
      // First check if collection exists and has documents
      const collectionRef = collection(db, this.COLLECTION_NAME);
      const snapshot = await getDocs(collectionRef);
      
      if (snapshot.empty) {
        console.log('📭 No chat sessions found, returning empty array');
        return [];
      }
      
      // If we have documents, apply filters and ordering
      let q: any = collectionRef;
      
      if (userId) {
        q = query(q, where('userId', '==', userId));
      }
      
      // Only apply orderBy if we have documents
      if (snapshot.size > 0) {
        q = query(q, orderBy('timestamp', 'desc'), limit(limitCount));
      }
      
      const querySnapshot = await getDocs(q);
      const sessions: ChatSession[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as any;
        sessions.push({
          id: doc.id,
          title: data.title,
          messages: data.messages || [],
          timestamp: data.timestamp,
          userId: data.userId
        });
      });
      
      console.log(`✅ Found ${sessions.length} chat sessions`);
      return sessions;
    } catch (error) {
      console.error('❌ Error getting chat sessions:', error);
      // Return empty array instead of throwing error for better UX
      return [];
    }
  }

  // Get a specific chat session by ID
  async getChatSession(sessionId: string): Promise<ChatSession | null> {
    await this.checkFirestore();
    
    try {
      const docRef = doc(db, this.COLLECTION_NAME, sessionId);
      const docSnap = await getDocs(query(collection(db, this.COLLECTION_NAME), where('__name__', '==', sessionId)));
      
      if (!docSnap.empty) {
        const data = docSnap.docs[0].data() as any;
        return {
          id: docSnap.docs[0].id,
          title: data.title,
          messages: data.messages || [],
          timestamp: data.timestamp,
          userId: data.userId
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting chat session:', error);
      throw new Error('Failed to get chat session');
    }
  }

  // Update a chat session
  async updateChatSession(sessionId: string, data: UpdateChatSessionData): Promise<void> {
    await this.checkFirestore();
    
    try {
      const docRef = doc(db, this.COLLECTION_NAME, sessionId);
      const updateData: any = {};
      
      if (data.title !== undefined) {
        updateData.title = data.title;
      }
      
      if (data.messages !== undefined) {
        updateData.messages = data.messages.map(msg => {
          // Filter out undefined values and ensure all required fields are present
          const cleanMessage: any = {
            role: msg.role || 'user',
            content: msg.content || '',
            timestamp: Timestamp.now()
          };
          
          // Only add optional fields if they have valid values
          if (msg.imageData) cleanMessage.imageData = msg.imageData;
          if (msg.imageName) cleanMessage.imageName = msg.imageName;
          if (msg.apiUsed) cleanMessage.apiUsed = msg.apiUsed;
          if (msg.model) cleanMessage.model = msg.model; // Ensure model is preserved
          
          return cleanMessage;
        });
      }
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating chat session:', error);
      throw new Error('Failed to update chat session');
    }
  }

  // Delete a chat session
  async deleteChatSession(sessionId: string): Promise<void> {
    await this.checkFirestore();
    
    try {
      const docRef = doc(db, this.COLLECTION_NAME, sessionId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting chat session:', error);
      throw new Error('Failed to delete chat session');
    }
  }

  // Clear all chat sessions for a user
  async clearAllSessions(userId?: string): Promise<void> {
    await this.checkFirestore();
    
    try {
      const sessions = await this.getChatSessions(userId);
      const deletePromises = sessions.map(session => 
        deleteDoc(doc(db, this.COLLECTION_NAME, session.id))
      );
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error clearing all sessions:', error);
      throw new Error('Failed to clear all sessions');
    }
  }

  // Add a message to an existing chat session
  async addMessageToSession(sessionId: string, message: Omit<ChatItem, 'timestamp'>): Promise<void> {
    await this.checkFirestore();
    
    try {
      const session = await this.getChatSession(sessionId);
      if (!session) {
        throw new Error('Chat session not found');
      }
      
      // Clean the message to ensure no undefined values
      const newMessage: ChatItem = {
        role: message.role || 'user',
        content: message.content || '',
        timestamp: Timestamp.now()
      };
      
      // Only add optional fields if they have valid values
      if (message.imageData) newMessage.imageData = message.imageData;
      if (message.imageName) newMessage.imageName = message.imageName;
      if (message.apiUsed) newMessage.apiUsed = message.apiUsed;
      if (message.model) newMessage.model = message.model; // Ensure model is preserved
      
      const updatedMessages = [...session.messages, newMessage];
      await this.updateChatSession(sessionId, { messages: updatedMessages });
    } catch (error) {
      console.error('Error adding message to session:', error);
      throw new Error('Failed to add message to session');
    }
  }

  // Clean up old chat sessions (keep only the most recent ones)
  async cleanupOldSessions(userId?: string, maxSessions: number = 50): Promise<void> {
    await this.checkFirestore();
    
    try {
      const sessions = await this.getChatSessions(userId, maxSessions + 10); // Get extra to check for cleanup
      
      if (sessions.length > maxSessions) {
        const sessionsToDelete = sessions.slice(maxSessions);
        
        for (const session of sessionsToDelete) {
          await this.deleteChatSession(session.id);
        }
        
        console.log(`Cleaned up ${sessionsToDelete.length} old chat sessions`);
      }
    } catch (error) {
      console.error('Error cleaning up old sessions:', error);
      throw new Error('Failed to cleanup old sessions');
    }
  }
}

export const firestoreService = new FirestoreService();
export default firestoreService;
