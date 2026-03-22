import { useState } from 'react';
import { X, Send, Loader2, Sparkles, PlusCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, addDoc } from 'firebase/firestore';
import { GoogleGenAI } from "@google/genai";
import { KnowledgeCard } from '../types';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';

interface CaptureProps {
  onClose: () => void;
  onSave: (card: KnowledgeCard) => void;
}

export default function Capture({ onClose, onSave }: CaptureProps) {
  const [content, setContent] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [summary, setSummary] = useState('');

  const handleSummarize = async () => {
    if (!content.trim()) return;
    setIsSummarizing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Summarize the following content in a concise way, and extract 3-5 relevant tags. Format as JSON: { "summary": "...", "tags": ["...", "..."] }. Content: ${content}`,
        config: { responseMimeType: "application/json" }
      });
      
      const data = JSON.parse(response.text || '{}');
      setSummary(data.summary || '');
      setTags(Array.isArray(data.tags) ? data.tags : []);
      if (!title) {
        setTitle(content.split('\n')[0].substring(0, 50) || 'Untitled Note');
      }
    } catch (error) {
      console.error("Summarization failed", error);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim() || !auth.currentUser) return;
    
    setIsSaving(true);
    const cardData = {
      uid: auth.currentUser.uid,
      title: title || content.split('\n')[0].substring(0, 50) || 'Untitled Note',
      content,
      tags,
      summary,
      created_at: Date.now(),
      updated_at: Date.now(),
      links: [],
    };
    
    try {
      const docRef = await addDoc(collection(db, 'cards'), cardData);
      onSave({ ...cardData, id: docRef.id } as KnowledgeCard);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'cards');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-600" />
            Capture Knowledge
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Content</label>
            <textarea
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind? Paste a link, a quote, or just start typing..."
              className="w-full h-40 p-4 bg-gray-50 border-none rounded-2xl resize-none focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none text-gray-700 leading-relaxed"
            />
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleSummarize}
              disabled={isSummarizing || !content.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-all disabled:opacity-50"
            >
              {isSummarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              AI Auto-Organize
            </button>
          </div>

          {(summary || tags.length > 0) && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4"
            >
              {summary && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">AI Summary</span>
                  <p className="text-sm text-indigo-900 leading-relaxed">{summary}</p>
                </div>
              )}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-white border border-indigo-100 text-indigo-600 rounded-lg text-xs font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Title (Optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give it a name..."
              className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none text-gray-700"
            />
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-gray-500 font-medium hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={!content.trim()}
            className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
          >
            Save to Library
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}



