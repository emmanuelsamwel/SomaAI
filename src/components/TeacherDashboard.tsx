import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, BookOpen, TrendingUp, AlertCircle, Search, Filter, Download, Sparkles, Bot, Send, User, Loader2, Languages, Plus, Trash2, CheckCircle2, MessageSquare, X, School, LogOut, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getLessonPlanResponse } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { useSound } from '../context/SoundContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, where, limit } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const TeacherDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { playSound } = useSound();
  const [activeTab, setActiveTab] = useState<'students' | 'planner' | 'analytics' | 'topics'>('students');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const handleTabChange = (tab: typeof activeTab) => {
    playSound('pop');
    setActiveTab(tab);
  };

  const students = [
    { uid: 'student_1', name: 'Alice Johnson', grade: 'A', progress: 92, status: 'On Track', habits: ['Visual Learner', 'Morning Study'] },
    { uid: 'student_2', name: 'Bob Smith', grade: 'B-', progress: 65, status: 'Needs Attention', habits: ['Fast Reader', 'Evening Study'] },
    { uid: 'student_3', name: 'Charlie Brown', grade: 'C+', progress: 45, status: 'At Risk', habits: ['Gaming Enthusiast', 'Late Night'] },
    { uid: 'student_4', name: 'Diana Prince', grade: 'A+', progress: 98, status: 'On Track', habits: ['Researcher', 'Early Bird'] },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 lg:relative lg:translate-x-0 transition-all duration-300 ease-in-out bg-white border-r border-slate-200 flex flex-col h-screen
        ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
        ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}
      `}>
        <div className={`p-6 flex items-center ${isSidebarCollapsed ? 'lg:justify-center' : 'gap-4'}`}>
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-100 rotate-3 shrink-0">
            <School size={28} />
          </div>
          {(!isSidebarCollapsed || isSidebarOpen) && (
            <span className="font-display font-black text-2xl text-slate-900 tracking-tight truncate">SomaAI</span>
          )}
        </div>

        <div className="px-4 mb-4 hidden lg:block">
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all"
          >
            <motion.div animate={{ rotate: isSidebarCollapsed ? 180 : 0 }}>
              <TrendingUp size={20} className="rotate-90" />
            </motion.div>
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-2 overflow-y-auto">
          {[
            { id: 'students', label: 'Students', icon: <Users size={22} /> },
            { id: 'topics', label: 'Topics', icon: <BookOpen size={22} /> },
            { id: 'planner', label: 'Lesson Planner', icon: <Sparkles size={22} /> },
            { id: 'analytics', label: 'Analytics', icon: <TrendingUp size={22} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                handleTabChange(tab.id as any);
                setIsSidebarOpen(false);
              }}
              title={isSidebarCollapsed ? tab.label : ''}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'lg:justify-center' : 'gap-4'} px-5 py-4 rounded-2xl transition-all duration-300 group ${
                activeTab === tab.id 
                  ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-100' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className={`${activeTab === tab.id ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'} transition-colors shrink-0`}>
                {tab.icon}
              </span>
              {(!isSidebarCollapsed || isSidebarOpen) && (
                <span className="font-bold tracking-tight truncate">{tab.label}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className={`flex items-center ${isSidebarCollapsed ? 'lg:justify-center' : 'gap-4'} p-3 bg-slate-50 rounded-2xl mb-4 border border-slate-100`}>
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100 shrink-0">
              <User size={20} />
            </div>
            {(!isSidebarCollapsed || isSidebarOpen) && (
              <div className="overflow-hidden">
                <p className="text-sm font-black text-slate-900 truncate">{profile?.displayName || 'Teacher'}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Educator</p>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              playSound('click');
              window.location.reload();
            }}
            title={isSidebarCollapsed ? 'Sign Out' : ''}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'lg:justify-center' : 'gap-4'} px-5 py-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all font-bold`}
          >
            <LogOut size={22} className="shrink-0" />
            {(!isSidebarCollapsed || isSidebarOpen) && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Bar (Mobile & Focus Mode Toggle) */}
        <div className="lg:hidden p-4 bg-white border-b border-slate-200 flex justify-between items-center">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600">
            <School size={24} />
          </button>
          <span className="font-display font-black text-xl text-slate-900">SomaAI</span>
          <div className="w-10" /> {/* Spacer */}
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-10">
          <header className={`mb-8 lg:mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-500 ${isFocusMode ? 'opacity-0 h-0 overflow-hidden mb-0' : 'opacity-100'}`}>
            <div>
              <h1 className="text-3xl lg:text-4xl font-black text-slate-900 mb-2">
                Teacher <span className="text-emerald-600">Dashboard</span>
              </h1>
              <p className="text-slate-500 font-medium text-base lg:text-lg">Empowering the next generation of learners.</p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              <button 
                onClick={() => setIsFocusMode(!isFocusMode)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
              >
                <Target size={18} className={isFocusMode ? 'text-emerald-600' : ''} />
                {isFocusMode ? 'Exit Focus' : 'Focus Mode'}
              </button>
              <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-emerald-600 transition-all shadow-sm">
                <Download size={20} />
              </button>
            </div>
          </header>

          {isFocusMode && (
            <div className="mb-6 flex justify-end">
              <button 
                onClick={() => setIsFocusMode(false)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-100"
              >
                <Target size={18} />
                Exit Focus Mode
              </button>
            </div>
          )}

        {/* Main Content Sections */}
        {activeTab === 'students' && !isFocusMode && (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Total Students', value: '32', color: 'bg-blue-50', text: 'text-blue-600' },
                { label: 'Avg. Class Grade', value: 'B+', color: 'bg-emerald-50', text: 'text-emerald-600' },
                { label: 'At Risk', value: '3', color: 'bg-red-50', text: 'text-red-600' },
                { label: 'Engagement', value: '88%', color: 'bg-amber-50', text: 'text-amber-600' },
              ].map((stat, i) => (
                <div key={i} className={`${stat.color} p-6 rounded-2xl border border-white shadow-sm`}>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">{stat.label}</p>
                  <p className={`text-2xl font-black ${stat.text}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Student Table */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-xl font-black text-slate-900">Student Performance</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search students..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-100" />
                  </div>
                  <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-emerald-600">
                    <Filter size={18} />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                      <th className="px-6 py-4">Student Name</th>
                      <th className="px-6 py-4">Current Grade</th>
                      <th className="px-6 py-4">Progress</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Habits & Hobbies</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((s, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-xs">
                              {s.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="font-bold text-slate-900">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">{s.grade}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.progress}%` }} />
                            </div>
                            <span className="text-xs text-slate-500">{s.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            s.status === 'On Track' ? 'bg-emerald-100 text-emerald-600' : 
                            s.status === 'Needs Attention' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {s.habits.map(h => (
                              <span key={h} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-medium">{h}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                playSound('pop');
                                setSelectedStudent(s);
                              }}
                              className="text-emerald-600 font-bold text-sm hover:underline flex items-center gap-1"
                            >
                              <MessageSquare size={14} /> Feedback
                            </button>
                            <button className="text-slate-400 font-bold text-sm hover:underline">Details</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <AnimatePresence>
              {selectedStudent && (
                <FeedbackModal 
                  student={selectedStudent} 
                  onClose={() => setSelectedStudent(null)} 
                />
              )}
            </AnimatePresence>

            {/* AI Insights Section */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle size={20} />
                    <h3 className="font-bold text-lg">AI Teaching Insights</h3>
                  </div>
                  <p className="text-indigo-100 text-sm leading-relaxed mb-6">
                    "Class performance in 'Thermodynamics' is 15% lower than average. 
                    SomaAI suggests using the 3D Engine model to visualize heat transfer, 
                    as 65% of your students are visual learners."
                  </p>
                  <button 
                    onClick={() => handleTabChange('planner')}
                    className="px-6 py-2 bg-white text-indigo-600 font-bold rounded-xl text-sm hover:bg-indigo-50 transition-all"
                  >
                    Generate Teaching Aids
                  </button>
                </div>
                <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
              </div>
              
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
                <h3 className="font-black text-slate-900 mb-4">Class Habit Distribution</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Visual Learners', value: 65, color: 'bg-indigo-500' },
                    { label: 'Auditory Learners', value: 20, color: 'bg-emerald-500' },
                    { label: 'Reading/Writing', value: 15, color: 'bg-amber-500' },
                  ].map((h, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-xs font-bold text-slate-500 w-32">{h.label}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${h.color}`} style={{ width: `${h.value}%` }} />
                      </div>
                      <span className="text-xs font-black text-slate-900 w-8">{h.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'planner' && <LessonPlanner />}

        {activeTab === 'topics' && <TopicManager />}

        {activeTab === 'analytics' && (
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Detailed Analytics</h2>
            <div className="flex items-center justify-center p-12 text-slate-400 italic">
              Advanced analytics dashboard coming soon...
            </div>
          </div>
        )}
      </div>
    </main>
  </div>
);
};

const FeedbackModal: React.FC<{ student: any; onClose: () => void }> = ({ student, onClose }) => {
  const { profile } = useAuth();
  const { playSound } = useSound();
  const [feedback, setFeedback] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, [student.uid]);

  const fetchFeedback = async () => {
    try {
      const q = query(
        collection(db, 'feedback'),
        where('studentUid', '==', student.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      const fetchedFeedback = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(fetchedFeedback);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim() || !profile) return;

    setSubmitting(true);
    playSound('pop');

    try {
      const feedbackData = {
        id: `fb_${Date.now()}`,
        studentUid: student.uid,
        teacherUid: profile.uid,
        content: feedback,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'feedback'), feedbackData);
      setFeedback('');
      playSound('notification');
      fetchFeedback();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
              <MessageSquare size={24} />
            </div>
            <div>
              <h2 className="font-black text-slate-900 text-lg">Student Feedback</h2>
              <p className="text-xs text-slate-500 font-medium">Recording progress for {student.name}</p>
            </div>
          </div>
          <button 
            onClick={() => {
              playSound('pop');
              onClose();
            }}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Feedback Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">New Feedback Note</label>
              <textarea 
                required
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={`How is ${student.name.split(' ')[0]} doing today? Mention progress or habits...`}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 outline-none transition-all font-medium resize-none"
              />
            </div>
            <div className="flex justify-end">
              <button 
                disabled={submitting || !feedback.trim()}
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                Save Note
              </button>
            </div>
          </form>

          {/* Feedback History */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Recent Feedback History</h3>
            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="animate-spin text-emerald-600" size={32} />
              </div>
            ) : history.length === 0 ? (
              <div className="py-12 text-center text-slate-400 italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No feedback recorded yet for this student.
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                    <p className="text-sm text-slate-700 leading-relaxed mb-2">{item.content}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400">
                        {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : 'Just now'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const TopicManager: React.FC = () => {
  const { playSound } = useSound();
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    modelType: 'skeleton' as 'skeleton' | 'engine' | 'cell' | 'solar_system'
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const q = query(collection(db, 'topics'), orderBy('title', 'asc'));
      const querySnapshot = await getDocs(q);
      const fetchedTopics = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTopics(fetchedTopics);
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSubmitting(true);
    playSound('pop');

    try {
      const topicData = {
        ...formData,
        id: formData.title.toLowerCase().replace(/\s+/g, '-'),
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'topics'), topicData);
      setSuccess(true);
      playSound('notification');
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        setShowForm(false);
        setFormData({
          title: '',
          description: '',
          content: '',
          modelType: 'skeleton'
        });
        fetchTopics();
      }, 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'topics');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Topic Management</h2>
          <p className="text-slate-500">Create and organize educational content for your students.</p>
        </div>
        <button 
          onClick={() => {
            playSound('pop');
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
        >
          {showForm ? 'Cancel' : <><Plus size={20} /> Create New Topic</>}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl"
          >
            {success ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Topic Created Successfully!</h3>
                <p className="text-slate-500">Your new topic has been added to the curriculum.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Topic Title</label>
                    <input 
                      required
                      type="text" 
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., The Human Skeleton"
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">3D Model Type</label>
                    <select 
                      value={formData.modelType}
                      onChange={(e) => setFormData({ ...formData, modelType: e.target.value as any })}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                    >
                      <option value="skeleton">Skeleton</option>
                      <option value="engine">Engine</option>
                      <option value="cell">Cell</option>
                      <option value="solar_system">Solar System</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Short Description</label>
                  <input 
                    type="text" 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief overview of the topic..."
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 outline-none transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Topic Content (Markdown supported)</label>
                  <textarea 
                    rows={6}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Detailed educational content..."
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 outline-none transition-all font-medium resize-none"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    disabled={submitting}
                    type="submit"
                    className="px-10 py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50 flex items-center gap-3"
                  >
                    {submitting ? <><Loader2 className="animate-spin" /> Saving...</> : 'Publish Topic'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-black text-slate-900">Existing Topics</h3>
        </div>
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
          </div>
        ) : topics.length === 0 ? (
          <div className="p-12 text-center text-slate-400 italic">
            No topics created yet. Click "Create New Topic" to get started.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {topics.map((topic) => (
              <div key={topic.id} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                <div>
                  <h4 className="font-bold text-slate-900">{topic.title}</h4>
                  <p className="text-sm text-slate-500">{topic.description || 'No description'}</p>
                  <div className="mt-2 flex gap-2">
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded text-[10px] font-black uppercase tracking-wider">
                      {topic.modelType}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                    <Search size={18} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const LessonPlanner: React.FC = () => {
  const { playSound } = useSound();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your SomaAI Lesson Planner. I can help you create lesson plans, find resources, and suggest interactive activities. What are we planning today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('English');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    playSound('pop');

    try {
      const response = await getLessonPlanResponse(input, language);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      playSound('notification');
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="font-black text-slate-900">AI Lesson Planner</h2>
            <p className="text-xs text-slate-500 font-medium">Expert educational consultant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Languages size={18} className="text-slate-400" />
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="text-sm bg-transparent border-none focus:ring-0 text-slate-600 font-bold cursor-pointer"
          >
            <option>English</option>
            <option>Swahili</option>
            <option>French</option>
            <option>Spanish</option>
          </select>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-200">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                m.role === 'user' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-600'
              }`}>
                {m.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={`p-5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                m.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-tr-none' 
                  : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none'
              }`}>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl rounded-tl-none flex items-center gap-3">
              <Loader2 size={20} className="animate-spin text-emerald-600" />
              <span className="text-sm text-slate-500 font-medium tracking-tight">SomaAI is drafting your plan...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-slate-100 bg-white">
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-emerald-300 focus-within:ring-4 focus-within:ring-emerald-50 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="e.g., Create a lesson plan for 10th grade Biology on Cell Division..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 font-medium"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
