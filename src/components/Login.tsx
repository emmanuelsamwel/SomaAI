import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth, googleProvider, signInWithPopup, db, doc, setDoc } from '../firebase';
import { LogIn, GraduationCap, School, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { loginAsMock } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (role: 'student' | 'teacher') => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: role,
        language: 'English',
        hobbies: [],
        habits: []
      }, { merge: true });
      
      window.location.reload();
    } catch (error: any) {
      console.error(error);
      setError("Google Login is currently unavailable due to Firebase configuration. Please use 'Demo Mode' to explore the app.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl rotate-12 flex items-center justify-center text-white mx-auto shadow-2xl shadow-indigo-200">
            <GraduationCap size={48} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">SomaAI</h1>
          <p className="text-slate-500 text-lg">The future of education, powered by AI.</p>
        </div>

        {error && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-700 text-sm flex items-center gap-3">
            <AlertCircle size={20} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-left ml-1">Real Login (Requires Setup)</p>
            <button
              onClick={() => handleLogin('student')}
              className="w-full group relative flex items-center justify-center gap-3 p-4 bg-white border-2 border-slate-200 rounded-2xl hover:border-indigo-600 hover:bg-indigo-50 transition-all duration-300 shadow-sm"
            >
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <GraduationCap size={20} />
              </div>
              <div className="text-left">
                <div className="font-bold text-slate-900">Sign in with Google</div>
              </div>
            </button>
          </div>

          <div className="space-y-2 pt-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-left ml-1">Demo Mode (No Login Required)</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => loginAsMock('student')}
                className="flex flex-col items-center gap-2 p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                <GraduationCap size={24} />
                <span className="font-bold text-sm">Student Demo</span>
              </button>
              <button
                onClick={() => loginAsMock('teacher')}
                className="flex flex-col items-center gap-2 p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
              >
                <School size={24} />
                <span className="font-bold text-sm">Teacher Demo</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Demo mode allows you to explore all features without a real account.
        </p>
      </div>
    </div>
  );
};
