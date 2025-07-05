import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase.config';
import { User } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  isNewUser: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  markProfileComplete: () => void;
  deleteAccount: () => Promise<void>;
  checkIsAdmin: (email: string) => Promise<boolean>;
  updateUserProfile: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const adminDoc = await getDoc(doc(db, 'agents', user.uid));
        if (adminDoc.exists() && adminDoc.data().role === 'admin') {
          await signOut(auth);
          setCurrentUser(null);
          setUserProfile(null);
          setIsNewUser(false);
          setLoading(false);
          return;
        }

        setCurrentUser(user);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setUserProfile(userData);
          
          if (!userData.firstName || !userData.lastName || !userData.phone) {
            setIsNewUser(true);
          }
        } else {
          setIsNewUser(true);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setIsNewUser(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      const adminDoc = await getDoc(doc(db, 'agents', userCredential.user.uid));
      if (adminDoc.exists() && adminDoc.data().role === 'admin') {
        await signOut(auth);
        throw new Error('Admin accounts cannot access the mobile app. Please use the web dashboard.');
      }
    } catch (error: any) {
      if (error.message.includes('Admin accounts cannot access')) {
        throw error;
      }
      throw error;
    }
  };

  const register = async (email: string, password: string, userData: Partial<User>) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userProfile: User = {
      id: user.uid,
      email: user.email!,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      phone: userData.phone,
      countryCode: userData.countryCode || '1',
      dateOfBirth: userData.dateOfBirth,
      ...(userData.emergencyContact && { emergencyContact: userData.emergencyContact }),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);
    setUserProfile(userProfile);
    setIsNewUser(true);
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
    setIsNewUser(false);
  };

  const markProfileComplete = () => {
    setIsNewUser(false);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const checkIsAdmin = async (email: string): Promise<boolean> => {
    try {
      const agentsQuery = query(collection(db, 'agents'), where('email', '==', email));
      const agentsSnapshot = await getDocs(agentsQuery);
      return !agentsSnapshot.empty && agentsSnapshot.docs[0].data().role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  const updateUserProfile = async (userData: Partial<User>) => {
    if (!currentUser || !userProfile) {
      throw new Error('No user is currently logged in');
    }

    const updatedProfile = {
      ...userProfile,
      ...userData,
      updatedAt: new Date(),
    };

    await setDoc(doc(db, 'users', userProfile.id), updatedProfile, { merge: true });
    setUserProfile(updatedProfile);
  };

  const deleteAccount = async () => {
    if (!currentUser) {
      throw new Error('No user is currently logged in');
    }

    const userId = currentUser.uid;

    try {
      await deleteDoc(doc(db, 'users', userId));

      const scheduledCallsQuery = query(
        collection(db, 'scheduledCalls'),
        where('userId', '==', userId)
      );
      const scheduledCallsSnapshot = await getDocs(scheduledCallsQuery);
      const deleteScheduledCallsPromises = scheduledCallsSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      await Promise.all(deleteScheduledCallsPromises);

      const callHistoryQuery = query(
        collection(db, 'callHistory'),
        where('userId', '==', userId)
      );
      const callHistorySnapshot = await getDocs(callHistoryQuery);
      const deleteCallHistoryPromises = callHistorySnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      await Promise.all(deleteCallHistoryPromises);

      await deleteUser(currentUser);

      setCurrentUser(null);
      setUserProfile(null);
      setIsNewUser(false);
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    isNewUser,
    login,
    register,
    logout,
    resetPassword,
    markProfileComplete,
    deleteAccount,
    checkIsAdmin,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
