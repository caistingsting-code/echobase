import { useState } from 'react';
import { KnowledgeCard } from '../types';
import { 
  Search, 
  Filter, 
  Tag, 
  Trash2, 
  Edit3, 
  ChevronRight, 
  MoreVertical,
  Calendar,
  ExternalLink,
  Library
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface LibraryViewProps {
  cards: KnowledgeCard[];
}

export default function LibraryView({ cards }: LibraryViewProps) {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<KnowledgeCard | null>(null);

  const allTags = Array.from(new Set(cards.flatMap(c => c.tags || [])));

  const filteredCards = cards.filter(card => {
    const matchesSearch = card.title.toLowerCase().includes(search.toLowerCase()) || 
                         card.content.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !selectedTag || (card.tags || []).includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const deleteCard = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'cards', id));
      if (selectedCard?.id === id) setSelectedCard(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `cards/${id}`);
    }
  };

  return (
    <div className="flex h-full gap-8">
      {/* Sidebar List */}
      <div className="w-1/3 flex flex-col gap-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Filter cards..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${!selectedTag ? 'bg-indigo-600 text-white' : 'bg-white text-gray-400 border border-gray-100 hover:border-indigo-200'}`}
            >
              All
            </button>
            {allTags.map(tag => (
              <button 
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${selectedTag === tag ? 'bg-indigo-600 text-white' : 'bg-white text-gray-400 border border-gray-100 hover:border-indigo-200'}`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {filteredCards.map((card) => (
            <motion.div 
              key={card.id}
              layout
              onClick={() => setSelectedCard(card)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer group ${selectedCard?.id === card.id ? 'bg-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-sm'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className={`font-bold text-sm line-clamp-1 ${selectedCard?.id === card.id ? 'text-indigo-600' : 'text-gray-900'}`}>{card.title}</h3>
                <ChevronRight className={`w-4 h-4 transition-transform ${selectedCard?.id === card.id ? 'text-indigo-600 translate-x-1' : 'text-gray-300 group-hover:text-gray-400'}`} />
              </div>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{card.summary || card.content}</p>
              <div className="flex items-center gap-2 mt-3">
                {(card.tags || []).slice(0, 2).map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 bg-gray-50 text-gray-500 rounded-md text-[9px] font-bold uppercase tracking-widest">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Card Detail */}
      <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        {selectedCard ? (
          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedCard.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col h-full"
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 text-xs font-bold text-indigo-400 uppercase tracking-[0.2em]">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(selectedCard.created_at).toLocaleDateString()}</span>
                    {selectedCard.source && (
                      <>
                        <span className="w-1 h-1 bg-gray-200 rounded-full" />
                        <span className="flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          {selectedCard.source}
                        </span>
                      </>
                    )}
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{selectedCard.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-colors">
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => deleteCard(selectedCard.id)}
                    className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {selectedCard.summary && (
                  <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                      <Sparkles className="w-3 h-3" />
                      AI Summary
                    </div>
                    <p className="text-indigo-900 leading-relaxed italic">{selectedCard.summary}</p>
                  </div>
                )}

                <div className="prose prose-indigo max-w-none text-gray-700 leading-loose">
                  <ReactMarkdown>{selectedCard.content}</ReactMarkdown>
                </div>

                <div className="pt-8 border-t border-gray-50 space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <Tag className="w-3 h-3" />
                    Tags
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(selectedCard.tags || []).map(tag => (
                      <span key={tag} className="px-3 py-1 bg-gray-50 text-gray-600 rounded-xl text-xs font-semibold border border-gray-100">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
              <Library className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900">Select a card</h3>
              <p className="text-gray-400 max-w-xs">Choose a card from the library to view its details and AI insights.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Sparkles({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  );
}
