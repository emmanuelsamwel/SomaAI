import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Tutor } from './Tutor';
import { StudyPlan } from './StudyPlan';
import { LayoutDashboard, BookOpen, BarChart3, Settings, LogOut, User as UserIcon, TrendingUp, Clock, Award, Target } from 'lucide-react';
import { auth, signOut } from '../firebase';
import { motion } from 'motion/react';
import { useSound } from '../context/SoundContext';
import { Volume2, VolumeX } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const { isMuted, toggleMute, playSound } = useSound();
  const [activeTab, setActiveTab] = React.useState<'tutor' | 'progress' | 'study-plan' | 'settings'>('tutor');

  const handleLogout = () => {
    playSound('click');
    signOut(auth);
    window.location.reload();
  };

  const handleTabChange = (tab: typeof activeTab) => {
    playSound('pop');
    setActiveTab(tab);
  };

  const stats = [
    { label: 'Topics Mastered', value: '12', icon: <Award className="text-amber-500" />, color: 'bg-amber-50' },
    { label: 'Study Hours', value: '48.5', icon: <Clock className="text-blue-500" />, color: 'bg-blue-50' },
    { label: 'Avg. Score', value: '92%', icon: <TrendingUp className="text-emerald-500" />, color: 'bg-emerald-50' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <LayoutDashboard size={24} />
          </div>
          <span className="font-black text-xl text-slate-900 tracking-tight">SomaAI</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button
            onClick={() => handleTabChange('tutor')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'tutor' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <BookOpen size={20} />
            <span className="font-medium">AI Tutor</span>
          </button>
          <button
            onClick={() => handleTabChange('progress')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'progress' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <BarChart3 size={20} />
            <span className="font-medium">Progress</span>
          </button>
          <button
            onClick={() => handleTabChange('study-plan')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'study-plan' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Target size={20} />
            <span className="font-medium">Study Plan</span>
          </button>
          <button
            onClick={() => handleTabChange('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-4">
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">
              <UserIcon size={20} />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{profile?.displayName || 'User'}</p>
              <p className="text-xs text-slate-500 capitalize">{profile?.role || 'Student'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900">
              Welcome back, {profile?.displayName?.split(' ')[0] || 'Learner'}!
            </h1>
            <p className="text-slate-500 mt-1">Ready to master something new today?</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Current Language</p>
            <p className="text-indigo-600 font-bold">{profile?.language || 'English'}</p>
          </div>
        </header>

        {activeTab === 'tutor' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`${stat.color} p-6 rounded-2xl border border-white shadow-sm flex items-center gap-4`}
                >
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                    <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Tutor Component */}
            <Tutor />
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Learning Progress</h2>
            <div className="space-y-6">
              {[
                { subject: 'Biology: Human Anatomy', progress: 85, color: 'bg-indigo-600' },
                { subject: 'Physics: Thermodynamics', progress: 45, color: 'bg-emerald-500' },
                { subject: 'Chemistry: Organic Compounds', progress: 20, color: 'bg-amber-500' },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-slate-700">{item.subject}</span>
                    <span className="text-slate-500">{item.progress}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.progress}%` }}
                      className={`h-full ${item.color} rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-12">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Hobby & Habit Analysis</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <p className="text-xs font-bold text-indigo-400 uppercase mb-2">Detected Hobbies</p>
                  <div className="flex flex-wrap gap-2">
                    {['Drawing', 'Scientific Research', 'Gaming'].map(h => (
                      <span key={h} className="px-3 py-1 bg-white text-indigo-600 rounded-full text-xs font-bold shadow-sm">{h}</span>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-400 uppercase mb-2">Learning Habits</p>
                  <div className="flex flex-wrap gap-2">
                    {['Early Bird', 'Visual Learner', 'Fast Reader'].map(h => (
                      <span key={h} className="px-3 py-1 bg-white text-emerald-600 rounded-full text-xs font-bold shadow-sm">{h}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'study-plan' && (
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
            <StudyPlan />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-2xl">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Settings</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Preferred Language</label>
                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none">
                  <option>English</option>
                  <option>Swahili</option>
                  <option>French</option>
                  <option>Spanish</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Sound Effects</label>
                <button
                  onClick={toggleMute}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                    !isMuted ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  {!isMuted ? <Volume2 size={20} /> : <VolumeX size={20} />}
                  <span className="font-bold">{!isMuted ? 'Sound Enabled' : 'Sound Muted'}</span>
                </button>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Notification Preferences</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-slate-600">Email reminders for study sessions</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-slate-600">AI Tutor proactive check-ins</span>
                  </label>
                </div>
              </div>
              <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                Save Changes
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
