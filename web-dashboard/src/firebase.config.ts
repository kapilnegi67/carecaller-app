import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBMd4Cw1SXwp57mHeYE2rXHX267pWFscak",
  authDomain: "carecaller-app.firebaseapp.com",
  projectId: "carecaller-app",
  storageBucket: "carecaller-app.firebasestorage.app",
  messagingSenderId: "667008149387",
  appId: "1:667008149387:web:19b4d3a2e6c8492d8cb18e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Failed to set Firebase Auth persistence:', error);
});

export const db = getFirestore(app);
export default app;
