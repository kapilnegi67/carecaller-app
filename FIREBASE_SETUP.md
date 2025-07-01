# Firebase Setup Guide for CareCaller

This guide will help you set up Firebase for the CareCaller application.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `carecaller-app` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In the Firebase console, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" provider
5. Click "Save"

## Step 3: Create Firestore Database

1. Go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (you can configure security rules later)
4. Select a location for your database
5. Click "Done"

## Step 4: Get Firebase Configuration

1. Go to "Project settings" (gear icon in left sidebar)
2. Scroll down to "Your apps" section
3. Click "Add app" and select the web icon (</>)
4. Register your app with a nickname (e.g., "CareCaller Web")
5. Copy the Firebase configuration object

## Step 5: Configure the Applications

### Mobile App Configuration
Replace the content in `mobile/firebase.config.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
```

### Web Dashboard Configuration
Replace the content in `web-dashboard/src/firebase.config.ts` with the same configuration.

## Step 6: Create Agent Account

Since the web dashboard is for agents, you'll need to create agent accounts manually:

1. Go to Authentication > Users in Firebase Console
2. Click "Add user"
3. Enter agent email and password
4. After creating the user, go to Firestore Database
5. Create a new collection called `agents`
6. Add a document with the user's UID as the document ID:

```json
{
  "email": "agent@example.com",
  "firstName": "Agent",
  "lastName": "Smith",
  "role": "agent",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

For admin users, set `"role": "admin"`.

## Step 7: Configure Firestore Security Rules (Production)

For production, replace the default Firestore rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only access their own scheduled calls
    match /scheduledCalls/{callId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Users can only access their own call history
    match /callHistory/{historyId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Agents can access all data
    match /{document=**} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/agents/$(request.auth.uid));
    }
  }
}
```

## Step 8: Test the Setup

1. Start both applications:
   ```bash
   # Terminal 1 - Mobile app
   cd mobile && npx expo start
   
   # Terminal 2 - Web dashboard
   cd web-dashboard && npm run dev
   ```

2. Test mobile app registration
3. Test web dashboard login with agent credentials
4. Verify data is being stored in Firestore

## Optional: Enable Push Notifications

For Expo push notifications:

1. Install Expo CLI: `npm install -g @expo/cli`
2. Run `expo install expo-notifications` in the mobile directory
3. Configure notification permissions in the app
4. Set up Expo push notification service

## Troubleshooting

### Common Issues

1. **"Firebase config not found"**
   - Make sure you've replaced the placeholder config in both apps

2. **"Permission denied" errors**
   - Check Firestore security rules
   - Ensure user is authenticated

3. **"Agent not found" in web dashboard**
   - Make sure you've created an agent document in Firestore
   - Verify the document ID matches the user's UID

4. **CORS errors in web dashboard**
   - Make sure you're running on the provided public URL
   - Check Firebase project settings for authorized domains

### Getting Help

- Check the Firebase Console for error logs
- Review the browser console for JavaScript errors
- Verify network requests in browser dev tools
- Check Expo logs for mobile app issues

## Production Deployment

Before deploying to production:

1. Update Firestore security rules (see Step 7)
2. Configure authorized domains in Firebase Console
3. Set up proper environment variables
4. Enable Firebase App Check for additional security
5. Configure backup and monitoring
