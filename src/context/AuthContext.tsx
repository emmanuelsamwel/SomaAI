import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, onAuthStateChanged, doc, getDoc, setDoc } from '../firebase';
import { User as FirebaseUser } from 'firebase/auth';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'student' | 'teacher';
  language: string;
  hobbies: string[];
  habits: string[];
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  setProfile: (profile: UserProfile) => void;
  loginAsMock: (role: 'student' | 'teacher') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loginAsMock = (role: 'student' | 'teacher') => {
    const mockUser = {
      uid: 'mock-user-id',
      email: 'demo@somaai.com',
      displayName: 'Demo User',
    } as FirebaseUser;
    
    const mockProfile: UserProfile = {
      uid: 'mock-user-id',
      email: 'demo@somaai.com',
      displayName: 'Demo User',
      role: role,
      language: 'English',
      hobbies: ['Learning', 'AI'],
      habits: ['Daily Study'],
    };
    
    setUser(mockUser);
    setProfile(mockProfile);
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } else {
        // Only reset if we're not in mock mode
        if (user?.uid !== 'mock-user-id') {
          setUser(null);
          setProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, setProfile, loginAsMock }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
