# Firestore Migration Guide

This guide explains how to set up Firebase/Firestore to replace localStorage for chat history storage.

## Prerequisites

1. A Firebase project (create one at [Firebase Console](https://console.firebase.google.com/))
2. Node.js and npm installed

## Setup Steps

### 1. Install Dependencies

The Firebase dependency has already been installed:
```bash
npm install firebase
```

### 2. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select an existing project
3. Enable Firestore Database:
   - Go to "Firestore Database" in the left sidebar
   - Click "Create database"
   - Choose "Start in test mode" for development
   - Select a location close to your users

### 3. Get Firebase Configuration

1. In your Firebase project, click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web app icon (</>)
5. Register your app with a nickname
6. Copy the configuration object

### 4. Create Environment Variables

Create a `.env.local` file in your project root with:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Optional: Use Firestore emulator in development
# NEXT_PUBLIC_USE_FIRESTORE_EMULATOR=true

# Existing API Keys
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### 5. Firestore Security Rules

Update your Firestore security rules to allow read/write access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /chatSessions/{document} {
      allow read, write: if true; // For development - restrict in production
    }
  }
}
```

**⚠️ Security Note**: The above rules allow anyone to read/write. For production, implement proper authentication and authorization.

### 6. Test the Setup

1. Start your development server: `npm run dev`
2. Open the chat page
3. Create a new chat session
4. Send a message
5. Check your Firestore console to see the data being stored

## What Changed

### Before (localStorage)
- Chat sessions stored in browser's localStorage
- Data persisted only on the user's device
- Limited storage capacity
- No cross-device synchronization

### After (Firestore)
- Chat sessions stored in cloud database
- Data accessible from any device
- Unlimited storage capacity
- Real-time synchronization
- Better data persistence and reliability

## Migration Notes

- Existing localStorage data will not be automatically migrated
- Users will start with fresh chat history
- All new chat sessions will be stored in Firestore
- The app will work offline but sync when connection is restored

## Troubleshooting

### Common Issues

1. **"Firebase: Error (auth/unauthorized)"**
   - Check your Firebase API key and project ID
   - Verify Firestore rules allow read/write access

2. **"Firebase: Error (app/no-app)"**
   - Ensure Firebase is properly initialized
   - Check environment variables are loaded

3. **"Firebase: Error (permission-denied)"**
   - Review Firestore security rules
   - Check if you're in the correct Firebase project

### Development Tips

- Use Firebase console to monitor data in real-time
- Enable Firestore emulator for offline development
- Check browser console for detailed error messages

## Next Steps

1. **Authentication**: Add user login/signup for multi-user support
2. **Data Migration**: Create a script to migrate existing localStorage data
3. **Offline Support**: Implement offline-first functionality with Firestore
4. **Security**: Implement proper user-based access control
5. **Backup**: Set up automated data backups

## Support

For Firebase-specific issues, refer to:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Community](https://firebase.google.com/community)
