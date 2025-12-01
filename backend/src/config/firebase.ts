import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
// You can either use a service account JSON file or environment variables

const initializeFirebase = () => {
  // Check if already initialized
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Option 1: Use service account file (recommended for production)
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  
  // Option 2: Use environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (serviceAccountPath) {
    // Use service account file
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin initialized with service account file');
  } else if (projectId && clientEmail && privateKey) {
    // Use environment variables
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log('✅ Firebase Admin initialized with environment variables');
  } else {
    console.warn('⚠️ Firebase not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    // Initialize without credentials for development (limited functionality)
    admin.initializeApp({
      projectId: 'demo-project',
    });
    console.log('⚠️ Firebase Admin initialized in demo mode');
  }

  return admin.app();
};

// Initialize on import
initializeFirebase();

export const firebaseAdmin = admin;
export const firebaseAuth = admin.auth();

// Verify Firebase ID token
export const verifyFirebaseToken = async (idToken: string): Promise<admin.auth.DecodedIdToken> => {
  try {
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid Firebase token');
  }
};

// Get or create user from Firebase token
export const getFirebaseUser = async (uid: string): Promise<admin.auth.UserRecord | null> => {
  try {
    return await firebaseAuth.getUser(uid);
  } catch (error) {
    return null;
  }
};
