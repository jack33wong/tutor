import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Your Firebase configuration
// You'll need to replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase only on the client side
let app: any = null;
let db: any = null;

// Function to initialize Firebase
function initializeFirebase() {
  if (typeof window !== 'undefined' && !app) {
    try {
      // Client-side initialization
      app = initializeApp(firebaseConfig);
      console.log('🔥 Firebase initialized with config:', {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain
      });

      // Initialize Firestore
      db = getFirestore(app);
      console.log('🗄️ Firestore initialized successfully');
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
    }
  }
}

// Initialize immediately if we're on the client side
if (typeof window !== 'undefined') {
  initializeFirebase();
} else {
  // Server-side - export null values
  console.log('🖥️ Running on server side, Firebase not initialized');
}

// Export db for use in services
export { db };

// Export initialization function for manual calls if needed
export { initializeFirebase };

// Connect to Firestore emulator in development if needed
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIRESTORE_EMULATOR === 'true') {
  connectFirestoreEmulator(db, 'localhost', 8080);
}

export default app;
