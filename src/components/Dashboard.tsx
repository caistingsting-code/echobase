import { KnowledgeCard, ViewMode } from '../types';
import { 
  TrendingUp, 
  Clock, 
  Tag, 
  ArrowRight, 
  Brain,
  Sparkles,
  Network
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  cards: KnowledgeCard[];
  setView: (view: ViewMode) => void;
}

export default function Dashboard({ cards, setView }: DashboardProps) {
  const recentCards = cards.slice(0, 4);
  const totalTags = new Set(cards.flatMap(c => c.tags || [])).size;

  const stats = [
    { label: 'Total Cards', value: cards.length, icon: Brain, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Knowledge Tags', value: totalTags, icon: Tag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Recent Activity', value: recentCards.length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Welcome back, Knowledge Builder.</h1>
        <p className="text-gray-500 text-lg">Your second brain has grown by <span className="text-indigo-600 font-semibold">{cards.length}</span> cards this month.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all"
          >
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Cards */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <History className="w-6 h-6 text-indigo-600" />
              Recent Knowledge
            </h2>
            <button 
              onClick={() => setView('library')}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
            >
              View Library
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentCards.length > 0 ? (
              recentCards.map((card, i) => (
                <motion.div 
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + (i * 0.05) }}
                  className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(card.tags || []).slice(0, 2).map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">{card.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed mb-4">
                    {card.summary || card.content}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                    <span>{new Date(card.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Connected
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-3 py-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-medium">Your knowledge base is empty. Start capturing!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function History({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>
    </svg>
  );
}
