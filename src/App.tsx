import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Library, 
  Network, 
  Brain, 
  PlusCircle, 
  Search, 
  Menu, 
  X,
  History,
  LogIn,
  LogOut,
  User as UserIcon,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

import { KnowledgeCard, ViewMode } from './types';
import { auth, db, login, logout, handleFirestoreError, OperationType } from './firebase';
import Dashboard from './components/Dashboard';
import LibraryView from './components/LibraryView';
import GraphView from './components/GraphView';
import AIChat from './components/AIChat';
import Capture from './components/Capture';
import ErrorBoundary from './components/ErrorBoundary';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [cards, setCards] = useState<KnowledgeCard[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Sync
  useEffect(() => {
    if (!isAuthReady || !user) {
      setCards([]);
      return;
    }

    const q = query(
      collection(db, 'cards'),
      where('uid', '==', user.uid),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newCards = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as KnowledgeCard[];
      setCards(newCards);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'cards');
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  const addCard = (card: KnowledgeCard) => {
    // Card is saved to Firestore in Capture component
    setIsCapturing(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'library', label: 'Library', icon: Library },
    { id: 'graph', label: 'Knowledge Graph', icon: Network },
    { id: 'chat', label: 'AI Brain', icon: Brain },
  ];

  if (!isAuthReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 max-w-md w-full text-center space-y-8"
        >
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white font-bold text-3xl mx-auto shadow-xl shadow-indigo-200">E</div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">EchoBase</h1>
            <p className="text-gray-500 leading-relaxed">Your AI-powered second brain. Sign in to start building your knowledge network.</p>
          </div>
          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 group"
          >
            <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-[#F9FAFB] text-[#111827] font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
        {/* Sidebar */}
        <aside 
          className={cn(
            "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col z-20",
            isSidebarOpen ? "w-64" : "w-20"
          )}
        >
          <div className="p-6 flex items-center justify-between">
            {isSidebarOpen ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">E</div>
                <span className="font-bold text-xl tracking-tight">EchoBase</span>
              </div>
            ) : (
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold mx-auto">E</div>
            )}
          </div>

          <nav className="flex-1 px-4 space-y-2 mt-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id as ViewMode)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                  view === item.id 
                    ? "bg-indigo-50 text-indigo-700 font-medium" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className={cn("w-5 h-5", view === item.id ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600")} />
                {isSidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100 space-y-4">
            <div className={cn("flex items-center gap-3 px-3 py-2", !isSidebarOpen && "justify-center")}>
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-gray-200" />
              ) : (
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{user.displayName}</p>
                  <button onClick={logout} className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:text-red-600 transition-colors">Sign Out</button>
                </div>
              )}
            </div>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-50 text-gray-400"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {/* Header */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-4 flex-1 max-w-2xl">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search your knowledge..." 
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsCapturing(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Capture</span>
              </button>
            </div>
          </header>

          {/* View Container */}
          <div className="flex-1 overflow-y-auto p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {view === 'dashboard' && <Dashboard cards={cards} setView={setView} />}
                {view === 'library' && <LibraryView cards={cards} />}
                {view === 'graph' && <GraphView cards={cards} />}
                {view === 'chat' && <AIChat cards={cards} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Capture Overlay */}
          <AnimatePresence>
            {isCapturing && (
              <Capture 
                onClose={() => setIsCapturing(false)} 
                onSave={addCard} 
              />
            )}
          </AnimatePresence>
        </main>
      </div>
    </ErrorBoundary>
  );
}


