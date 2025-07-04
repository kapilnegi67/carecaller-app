import { initializeApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBMd4Cw1SXwp57mHeYE2rXHX267pWFscak",
  authDomain: "carecaller-app.firebaseapp.com",
  projectId: "carecaller-app",
  storageBucket: "carecaller-app.firebasestorage.app",
  messagingSenderId: "667008149387",
  appId: "1:667008149387:web:19b4d3a2e6c8492d8cb18e"
};

const app = initializeApp(firebaseConfig);

let auth: Auth;
try {
  const { getReactNativePersistence } = require('firebase/auth');
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  auth = getAuth(app);
  console.warn('Firebase Auth: Using default persistence due to getReactNativePersistence compatibility issue');
}

export { auth };

export const db = getFirestore(app);
export default app;
