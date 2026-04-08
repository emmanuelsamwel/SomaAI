import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, collection, addDoc, query, where, onSnapshot, updateDoc, doc, deleteDoc, getDocs } from '../firebase';
import { Plus, Target, Calendar, CheckCircle2, Circle, Trash2, BookOpen, Loader2, Check, Sparkles, ListTodo } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSound } from '../context/SoundContext';
import { generateStudyPlan } from '../services/geminiService';

interface Topic {
  id: string;
  title: string;
}

interface StudyPlanItem {
  id: string;
  studentUid: string;
  goal: string;
  targetDate: string;
  linkedTopics: string[];
  tasks?: { title: string; completed: boolean }[];
  completed: boolean;
  progress: number;
}

export const StudyPlan: React.FC = () => {
  const { user } = useAuth();
  const { playSound } = useSound();
  const [plans, setPlans] = useState<StudyPlanItem[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [tasks, setTasks] = useState<{ title: string; completed: boolean }[]>([]);
  const [newTask, setNewTask] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [editingTopicsPlanId, setEditingTopicsPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // If it's a mock user, use static data
    if (user.uid === 'mock-user-id') {
      setPlans([
        {
          id: 'plan-1',
          studentUid: 'mock-user-id',
          goal: 'Master Human Anatomy',
          targetDate: '2026-05-01',
          linkedTopics: ['topic-1'],
          completed: false,
          progress: 45
        }
      ]);
      setTopics([
        { id: 'topic-1', title: 'Human Anatomy' },
        { id: 'topic-2', title: 'Thermodynamics' },
        { id: 'topic-3', title: 'Organic Chemistry' }
      ]);
      setLoading(false);
      return;
    }

    // Fetch study plans
    const q = query(collection(db, 'studyPlans'), where('studentUid', '==', user.uid));
    const unsubscribePlans = onSnapshot(q, (snapshot) => {
      const plansData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyPlanItem));
      setPlans(plansData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching study plans:", error);
      setLoading(false);
    });

    // Fetch topics
    const fetchTopics = async () => {
      try {
        const topicsSnap = await getDocs(collection(db, 'topics'));
        const topicsData = topicsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Topic));
        
        // If no topics exist, add some defaults for demo
        if (topicsData.length === 0) {
          const defaults = [
            { title: 'Human Anatomy' },
            { title: 'Thermodynamics' },
            { title: 'Organic Chemistry' },
            { title: 'Solar System' },
            { title: 'Cell Biology' }
          ];
          for (const t of defaults) {
            await addDoc(collection(db, 'topics'), { ...t, id: Math.random().toString(36).substr(2, 9) });
          }
          const updatedSnap = await getDocs(collection(db, 'topics'));
          setTopics(updatedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Topic)));
        } else {
          setTopics(topicsData);
        }
      } catch (error) {
        console.error("Error fetching topics:", error);
      }
    };

    fetchTopics();

    return () => unsubscribePlans();
  }, [user]);

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newGoal.trim()) return;

    try {
      await addDoc(collection(db, 'studyPlans'), {
        studentUid: user.uid,
        goal: newGoal,
        targetDate: newTargetDate,
        linkedTopics: selectedTopics,
        tasks: tasks,
        completed: false,
        progress: 0
      });
      playSound('success');
      setNewGoal('');
      setNewTargetDate('');
      setSelectedTopics([]);
      setTasks([]);
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding study plan:", error);
    }
  };

  const handleUpdateTopics = async (planId: string, newTopics: string[]) => {
    playSound('click');
    if (user?.uid === 'mock-user-id') {
      setPlans(prev => prev.map(p => p.id === planId ? { ...p, linkedTopics: newTopics } : p));
      setEditingTopicsPlanId(null);
      return;
    }

    try {
      const planRef = doc(db, 'studyPlans', planId);
      await updateDoc(planRef, { linkedTopics: newTopics });
      setEditingTopicsPlanId(null);
    } catch (error) {
      console.error("Error updating topics:", error);
    }
  };

  const toggleTopicSelection = (topicId: string) => {
    playSound('pop');
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId) 
        : [...prev, topicId]
    );
  };

  const toggleComplete = async (plan: StudyPlanItem) => {
    if (!plan.completed) {
      playSound('success');
    } else {
      playSound('click');
    }

    if (user?.uid === 'mock-user-id') {
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, completed: !p.completed, progress: !p.completed ? 100 : 0, tasks: p.tasks?.map(t => ({ ...t, completed: !p.completed })) } : p));
      return;
    }

    try {
      const planRef = doc(db, 'studyPlans', plan.id);
      const newCompleted = !plan.completed;
      const updatedTasks = plan.tasks?.map(t => ({ ...t, completed: newCompleted })) || [];
      
      await updateDoc(planRef, {
        completed: newCompleted,
        progress: newCompleted ? 100 : 0,
        tasks: updatedTasks
      });
    } catch (error) {
      console.error("Error updating study plan:", error);
    }
  };

  const toggleTask = async (plan: StudyPlanItem, taskIndex: number) => {
    playSound('pop');
    const updatedTasks = [...(plan.tasks || [])];
    updatedTasks[taskIndex].completed = !updatedTasks[taskIndex].completed;
    
    const completedCount = updatedTasks.filter(t => t.completed).length;
    const progress = Math.round((completedCount / updatedTasks.length) * 100);
    const completed = progress === 100;

    if (user?.uid === 'mock-user-id') {
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, tasks: updatedTasks, progress, completed } : p));
      return;
    }

    try {
      const planRef = doc(db, 'studyPlans', plan.id);
      await updateDoc(planRef, {
        tasks: updatedTasks,
        progress,
        completed
      });
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleGenerateAI = async () => {
    if (!newGoal.trim()) return;
    setGenerating(true);
    playSound('pop');
    try {
      const aiPlan = await generateStudyPlan(newGoal);
      if (aiPlan) {
        setNewGoal(aiPlan.goal);
        setNewTargetDate(aiPlan.targetDate);
        setTasks(aiPlan.tasks);
        playSound('notification');
      }
    } catch (error) {
      console.error("Error generating AI plan:", error);
    } finally {
      setGenerating(false);
    }
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, { title: newTask, completed: false }]);
    setNewTask('');
    playSound('pop');
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
    playSound('delete');
  };

  const handleDelete = async (id: string) => {
    playSound('delete');
    if (user?.uid === 'mock-user-id') {
      setPlans(prev => prev.filter(p => p.id !== id));
      return;
    }

    try {
      await deleteDoc(doc(db, 'studyPlans', id));
    } catch (error) {
      console.error("Error deleting study plan:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-900">My Study Plans</h2>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingTopicsPlanId(null);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={20} />
          {isAdding ? 'Cancel' : 'Set New Goal'}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleAddPlan}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">What is your goal?</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      placeholder="e.g., Master Human Anatomy"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={generating || !newGoal.trim()}
                    className="px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {generating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    <span className="hidden sm:inline">AI Plan</span>
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Target Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="date"
                    value={newTargetDate}
                    onChange={(e) => setNewTargetDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <ListTodo size={16} /> Study Tasks
              </label>
              <div className="space-y-2">
                {tasks.map((task, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="flex-1 text-sm font-medium text-slate-700">{task.title}</span>
                    <button
                      type="button"
                      onClick={() => removeTask(i)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTask())}
                    placeholder="Add a specific task..."
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 text-sm"
                  />
                  <button
                    type="button"
                    onClick={addTask}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-300 transition-all"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <BookOpen size={16} /> Link Topics
              </label>
              <div className="flex flex-wrap gap-2">
                {topics.map(topic => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => toggleTopicSelection(topic.id)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 border ${
                      selectedTopics.includes(topic.id)
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {selectedTopics.includes(topic.id) && <Check size={14} />}
                    {topic.title}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              Create Study Plan
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        {plans.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
              <Target size={32} />
            </div>
            <p className="text-slate-500 font-medium">No study goals set yet. Start by creating one!</p>
          </div>
        ) : (
          plans.map((plan) => (
            <motion.div
              key={plan.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-6 rounded-2xl border transition-all flex flex-col gap-4 ${
                plan.completed ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleComplete(plan)}
                  className={`shrink-0 transition-colors ${plan.completed ? 'text-emerald-600' : 'text-slate-300 hover:text-indigo-600'}`}
                >
                  {plan.completed ? <CheckCircle2 size={28} /> : <Circle size={28} />}
                </button>
                
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-lg truncate ${plan.completed ? 'text-emerald-900 line-through opacity-50' : 'text-slate-900'}`}>
                    {plan.goal}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 mt-1">
                    {plan.targetDate && (
                      <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
                        <Calendar size={14} />
                        {new Date(plan.targetDate).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
                      <BookOpen size={14} />
                      {plan.linkedTopics.length} Linked Topics
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Progress</p>
                    <p className={`text-lg font-black ${plan.completed ? 'text-emerald-600' : 'text-indigo-600'}`}>
                      {plan.progress}%
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              {/* Tasks List */}
              {plan.tasks && plan.tasks.length > 0 && (
                <div className="space-y-2 mt-2">
                  {plan.tasks.map((task, i) => (
                    <button
                      key={i}
                      onClick={() => toggleTask(plan, i)}
                      className="w-full flex items-center gap-3 p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-100 transition-all text-left group"
                    >
                      <div className={`shrink-0 transition-colors ${task.completed ? 'text-emerald-500' : 'text-slate-300 group-hover:text-indigo-400'}`}>
                        {task.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </div>
                      <span className={`text-sm font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {task.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Linked Topics Display & Management */}
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="flex flex-wrap gap-1">
                    {plan.linkedTopics.length > 0 ? (
                      plan.linkedTopics.map(topicId => {
                        const topic = topics.find(t => t.id === topicId);
                        return topic ? (
                          <span key={topicId} className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold border border-indigo-100">
                            {topic.title}
                          </span>
                        ) : null;
                      })
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No topics linked yet</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setEditingTopicsPlanId(editingTopicsPlanId === plan.id ? null : plan.id);
                      setSelectedTopics(plan.linkedTopics);
                    }}
                    className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                  >
                    {editingTopicsPlanId === plan.id ? 'Close' : 'Manage Topics'}
                  </button>
                </div>

                <AnimatePresence>
                  {editingTopicsPlanId === plan.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {topics.map(topic => (
                            <button
                              key={topic.id}
                              onClick={() => toggleTopicSelection(topic.id)}
                              className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-2 border ${
                                selectedTopics.includes(topic.id)
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-white text-slate-500 border-slate-200'
                              }`}
                            >
                              {selectedTopics.includes(topic.id) && <Check size={12} />}
                              {topic.title}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => handleUpdateTopics(plan.id, selectedTopics)}
                          className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all"
                        >
                          Save Topics
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
