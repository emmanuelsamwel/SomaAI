import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth, googleProvider, signInWithPopup, db, doc, setDoc, getDoc } from '../firebase';
import { LogIn, GraduationCap, School, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const Login: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (role: 'student' | 'teacher') => {
    setError(null);
    setIsLoggingIn(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userRef = doc(db, 'users', user.uid);
      // Check if user already exists to avoid overwriting role if they just want to sign in
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: role,
          language: 'English',
          hobbies: [],
          habits: []
        });
      }
      
      window.location.reload();
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/popup-closed-by-user') {
        setError("Login popup was closed. Please try again.");
      } else {
        setError("Failed to sign in with Google. Please ensure your browser allows popups.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-100/50 rounded-full blur-3xl animate-pulse delay-700" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-12 relative z-10"
      >
        <div className="space-y-6">
          <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] rotate-12 flex items-center justify-center text-white mx-auto shadow-2xl shadow-indigo-200">
            <GraduationCap size={56} />
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-display font-black text-slate-900 tracking-tight">SomaAI</h1>
            <p className="text-slate-500 text-xl font-medium">The future of education, <span className="text-indigo-600">powered by AI</span>.</p>
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-100 p-5 rounded-3xl text-red-700 text-sm flex items-center gap-4 shadow-sm"
          >
            <AlertCircle size={24} className="shrink-0" />
            <p className="font-bold text-left">{error}</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-6">
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-center">Choose your role to sign in</p>
            
            <button
              disabled={isLoggingIn}
              onClick={() => handleLogin('student')}
              className="w-full group relative flex items-center justify-center gap-6 p-6 bg-white border-2 border-slate-100 rounded-[2rem] hover:border-indigo-600 hover:bg-indigo-50 transition-all duration-500 shadow-xl shadow-slate-200/50 disabled:opacity-50 active:scale-95"
            >
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm">
                <GraduationCap size={32} />
              </div>
              <div className="text-left">
                <div className="font-display font-black text-slate-900 text-xl">I am a Student</div>
                <div className="text-sm text-slate-500 font-medium">Learn with AI and 3D models</div>
              </div>
            </button>

            <button
              disabled={isLoggingIn}
              onClick={() => handleLogin('teacher')}
              className="w-full group relative flex items-center justify-center gap-6 p-6 bg-white border-2 border-slate-100 rounded-[2rem] hover:border-emerald-600 hover:bg-emerald-50 transition-all duration-500 shadow-xl shadow-slate-200/50 disabled:opacity-50 active:scale-95"
            >
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-sm">
                <School size={32} />
              </div>
              <div className="text-left">
                <div className="font-display font-black text-slate-900 text-xl">I am a Teacher</div>
                <div className="text-sm text-slate-500 font-medium">Manage classes and create topics</div>
              </div>
            </button>
          </div>
        </div>

        <div className="pt-12">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            Secure • Personalized • Global
          </p>
        </div>
      </motion.div>
    </div>
  );
};
