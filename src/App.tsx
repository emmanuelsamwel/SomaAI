/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { SoundProvider } from './context/SoundContext';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="animate-spin text-indigo-600" />
          <p className="text-slate-500 font-medium animate-pulse">Initializing SomaAI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (profile?.role === 'teacher') {
    return <TeacherDashboard />;
  }

  return <Dashboard />;
};

export default function App() {
  return (
    <AuthProvider>
      <SoundProvider>
        <AppContent />
      </SoundProvider>
    </AuthProvider>
  );
}
