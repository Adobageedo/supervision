# Firebase Authentication Setup Guide

This guide explains how to set up Firebase Authentication for the Supervision application.

## Prerequisites

- A Google account
- Access to Firebase Console (https://console.firebase.google.com)

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"**
3. Enter a project name (e.g., "supervision-app")
4. Follow the setup wizard (you can disable Google Analytics if not needed)
5. Click **"Create project"**

## Step 2: Enable Email/Password Authentication

1. In your Firebase project, go to **Authentication** (left sidebar)
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Click on **"Email/Password"**
5. Enable **"Email/Password"** (first toggle)
6. Click **"Save"**

## Step 3: Get Firebase Web Config (Frontend)

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **"Your apps"**
3. Click **"Add app"** and select **Web** (</> icon)
4. Register your app with a nickname (e.g., "supervision-web")
5. Copy the Firebase configuration object

Update your frontend environment files with these values:

**`frontend/src/environments/environment.ts`** and **`environment.prod.ts`**:

```typescript
export const environment = {
  production: true,
  apiUrl: '/api',
  firebase: {
    apiKey: 'AIzaSy...',           // Your API key
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abc123'
  }
};
```

## Step 4: Get Firebase Admin SDK Credentials (Backend)

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Go to **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Download the JSON file (e.g., `serviceAccountKey.json`)

### Option A: Use Service Account File (Recommended for Production)

1. Place the downloaded JSON file in your backend directory
2. Add to `.gitignore`: `serviceAccountKey.json`
3. Set environment variable:
   ```
   FIREBASE_SERVICE_ACCOUNT_PATH=/app/serviceAccountKey.json
   ```

### Option B: Use Environment Variables

Extract values from the JSON file and set these environment variables:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Important:** The private key must include the `\n` characters for line breaks.

## Step 5: Update Environment Files

### Root `.env` file (for Docker Compose):

```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

### Backend `.env` file:

```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

## Step 6: Install Dependencies

### Backend:
```bash
cd backend
npm install firebase-admin
```

### Frontend:
```bash
cd frontend
npm install firebase @angular/fire
```

## Step 7: Create Initial Admin User

Since Firebase handles user registration, you need to create your admin user in Firebase:

### Option A: Firebase Console
1. Go to **Authentication** > **Users**
2. Click **"Add user"**
3. Enter email and password
4. The user will be created in Firebase and synced to your database on first login

### Option B: Firebase CLI
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Create user (requires custom script)
```

### Setting Admin Role
After the user logs in for the first time, update their role in the database:

```bash
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U supervision_user -d supervision_maintenance \
  -c "UPDATE users SET role = 'admin' WHERE email = 'your-admin@email.com';"
```

## Step 8: Deploy

1. Rebuild the backend:
   ```bash
   docker-compose -f docker-compose.prod.yml build backend
   ```

2. Rebuild the frontend:
   ```bash
   docker-compose -f docker-compose.prod.yml build frontend
   ```

3. Restart services:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Authentication Flow

### How it works:

1. **User enters email/password** in the frontend login form
2. **Frontend calls Firebase** `signInWithEmailAndPassword()`
3. **Firebase validates credentials** and returns an ID token
4. **Frontend sends ID token** to backend `/api/auth/login`
5. **Backend verifies token** with Firebase Admin SDK
6. **Backend creates/updates user** in local database
7. **Backend returns user data** to frontend
8. **Frontend stores user** and uses Firebase token for subsequent requests

### Token Refresh:
- Firebase ID tokens expire after 1 hour
- The frontend automatically refreshes tokens using `getIdToken()`
- The auth interceptor sends the current token with each request

## Troubleshooting

### "Firebase not configured" warning
- Check that environment variables are set correctly
- Verify the private key format (must include `\n` for line breaks)

### "Invalid Firebase token" error
- Ensure frontend and backend use the same Firebase project
- Check that the token hasn't expired
- Verify Firebase Admin SDK credentials

### User not found after login
- The user is created in the local database on first login
- Check database connection
- Verify the email matches

### CORS errors
- Ensure `CORS_ORIGIN` includes your frontend domain
- Check that the backend is running

## Security Considerations

1. **Never commit** Firebase credentials to version control
2. **Use environment variables** for all sensitive data
3. **Restrict Firebase API key** in Google Cloud Console
4. **Enable App Check** for additional security (optional)
5. **Set up security rules** in Firebase Console

## Additional Features (Optional)

### Google Sign-In
1. Enable Google provider in Firebase Console
2. Add Google Sign-In button to frontend
3. Use `signInWithPopup(auth, googleProvider)`

### Password Reset
```typescript
import { sendPasswordResetEmail } from '@angular/fire/auth';
await sendPasswordResetEmail(auth, email);
```

### Email Verification
```typescript
import { sendEmailVerification } from '@angular/fire/auth';
await sendEmailVerification(user);
```

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [AngularFire Documentation](https://github.com/angular/angularfire)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
