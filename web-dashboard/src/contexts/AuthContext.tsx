import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase.config';
import { Agent } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  adminProfile: Agent | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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
  const [adminProfile, setAdminProfile] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const adminDoc = await getDoc(doc(db, 'agents', user.uid));
          if (adminDoc.exists() && adminDoc.data().role === 'admin') {
            setAdminProfile({
              ...adminDoc.data(),
              createdAt: adminDoc.data().createdAt.toDate(),
            } as Agent);
          } else {
            setAdminProfile(null);
            await signOut(auth); // Sign out non-admin users
          }
        } catch (error) {
          console.error('Error fetching admin profile:', error);
          setAdminProfile(null);
          await signOut(auth); // Sign out on error for security
        }
      } else {
        setAdminProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      const adminDoc = await getDoc(doc(db, 'agents', userCredential.user.uid));
      if (!adminDoc.exists() || adminDoc.data().role !== 'admin') {
        await signOut(auth);
        throw new Error('Access denied. Admin privileges required.');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    currentUser,
    adminProfile,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
