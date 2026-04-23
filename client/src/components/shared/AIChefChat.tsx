'use client';
import { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';
import { MessageCircle, X, Send, Loader2, ChefHat } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message { role: 'user' | 'assistant'; text: string; }
const QUICK_PROMPTS = [
  'What can I cook in 20 minutes?',
  'Best substitutes for heavy cream?',
  'How do I make rice fluffy every time?',
];

export default function AIChefChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: "Hey! I'm your AI Chef 🍳 Ask me anything about cooking — substitutions, techniques, timing, or what to make with your ingredients!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (presetQuestion?: string) => {
    const q = (presetQuestion ?? input).trim();
    if (!q || loading) return;
    setInput('');
    const nextHistory = [...messages, { role: 'user' as const, text: q }];
    setMessages(nextHistory);
    setLoading(true);
    try {
      const context = nextHistory
        .slice(-6)
        .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
        .join('\n');
      const { data } = await api.post('/ai/ask', {
        question: q,
        context,
        history: nextHistory.slice(-8),
      });
      setMessages(m => [...m, { role: 'assistant', text: data.answer }]);
    } catch (err: any) {
      const message = err.response?.data?.message
        ? `I hit an issue: ${err.response.data.message}`
        : "Sorry, I couldn't connect right now. Try again!";
      setMessages(m => [...m, { role: 'assistant', text: message }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }} transition={{ duration: 0.2 }}
            className="w-80 h-[420px] card flex flex-col shadow-2xl shadow-black/50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center">
                  <ChefHat className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">AI Chef</p>
                  <p className="text-[10px] text-green-400">● Online</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 1 && (
                <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => send(prompt)}
                      className="badge bg-brand/10 text-brand border border-brand/20 text-[11px] hover:bg-brand/15"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-brand text-white rounded-br-sm'
                      : 'bg-surface-muted/40 text-gray-200 border border-surface-border rounded-bl-sm'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-surface-muted/40 border border-surface-border rounded-2xl rounded-bl-sm px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-brand" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-surface-border flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask anything cooking-related..." className="input flex-1 text-sm py-2" />
              <button onClick={() => send()} disabled={!input.trim() || loading}
                className="btn-primary p-2 aspect-square disabled:opacity-40">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button onClick={() => setOpen(o => !o)} whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.05 }}
        className="w-14 h-14 rounded-full bg-brand shadow-lg shadow-brand/30 flex items-center justify-center text-white animate-pulse-glow">
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}
