import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Global variables for Firebase instances
let app: FirebaseApp | null = null;
let db: Firestore | null = null;

// Function to initialize Firebase
function initializeFirebase(): { app: FirebaseApp; db: Firestore } {
  // Check if Firebase is already initialized
  if (getApps().length > 0) {
    app = getApps()[0];
    console.log('🔥 Firebase already initialized');
  } else {
    try {
      // Initialize Firebase
      app = initializeApp(firebaseConfig);
      console.log('🔥 Firebase initialized with config:', {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain
      });
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      throw error;
    }
  }

  // Initialize Firestore
  if (!db) {
    try {
      db = getFirestore(app);
      console.log('🗄️ Firestore initialized successfully');
    } catch (error) {
      console.error('❌ Firestore initialization failed:', error);
      throw error;
    }
  }

  return { app, db };
}

// Client-side initialization
if (typeof window !== 'undefined') {
  try {
    const { app: clientApp, db: clientDb } = initializeFirebase();
    app = clientApp;
    db = clientDb;
  } catch (error) {
    console.error('❌ Client-side Firebase initialization failed:', error);
  }
}

// Server-side initialization function
export function initializeServerFirebase(): { app: FirebaseApp; db: Firestore } {
  if (typeof window === 'undefined') {
    try {
      const { app: serverApp, db: serverDb } = initializeFirebase();
      console.log('🔥 Server-side Firebase initialized');
      return { app: serverApp, db: serverDb };
    } catch (error) {
      console.error('❌ Server-side Firebase initialization failed:', error);
      throw error;
    }
  } else {
    // On client side, return existing instances
    if (!app || !db) {
      const { app: clientApp, db: clientDb } = initializeFirebase();
      app = clientApp;
      db = clientDb;
    }
    return { app, db };
  }
}

// Export instances
export { app, db };

// Export initialization function
export { initializeFirebase };

// Connect to Firestore emulator in development if needed
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIRESTORE_EMULATOR === 'true') {
  if (db) {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('🔧 Connected to Firestore emulator');
    } catch (error) {
      console.warn('⚠️ Firestore emulator connection failed:', error);
    }
  }
}

export default app;
