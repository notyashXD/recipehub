'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Sparkles, X, Plus, ChefHat, Clock, Users, Loader2, Flame, ShoppingCart, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { usePantryStore } from '@/stores/pantryStore';

function MatchScoreRing({ score }: { score: number }) {
  const r = 20; const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 85 ? '#22c55e' : score >= 60 ? '#FF6B35' : '#6B7280';
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg width="56" height="56" className="-rotate-90">
        <circle cx="28" cy="28" r={r} stroke="#2A2D3A" strokeWidth="4" fill="none" />
        <circle cx="28" cy="28" r={r} stroke={color} strokeWidth="4" fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <span className="absolute text-xs font-bold text-white">{score}%</span>
    </div>
  );
}

const CATEGORIES = ['All', 'Can Cook Now', 'One Away', 'Quick (<15 min)'];
const CUISINES = ['Any', 'Italian', 'Indian', 'Asian', 'American', 'Mediterranean', 'French', 'Mexican'];

export default function CookPage() {
  const router = useRouter();
  const { items: pantryItems, fetchPantry } = usePantryStore();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [customIngredients, setCustomIngredients] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [usePantry, setUsePantry] = useState(true);
  const [filter, setFilter] = useState('All');
  const [cuisine, setCuisine] = useState('Any');
  const [stats, setStats] = useState({ canCookNow: 0, oneMissing: 0, totalChecked: 0 });

  useEffect(() => { fetchPantry(); }, []);

  const search = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      if (usePantry) {
        const res = await api.get('/match', { params: { cuisine: cuisine !== 'Any' ? cuisine : undefined } });
        data = res.data;
      } else {
        if (customIngredients.length === 0) { toast.error('Add at least one ingredient'); setLoading(false); return; }
        const res = await api.post('/match/custom', { ingredients: customIngredients, cuisine: cuisine !== 'Any' ? cuisine : undefined });
        data = res.data;
      }
      setMatches(data.matches || []);
      setStats({ canCookNow: data.canCookNow || 0, oneMissing: data.oneMissing || 0, totalChecked: data.totalRecipesChecked || 0 });
    } catch { toast.error('Failed to get matches'); }
    finally { setLoading(false); }
  }, [usePantry, customIngredients, cuisine]);

  useEffect(() => { search(); }, [usePantry, cuisine]);

  const addIngredient = () => {
    const trimmed = input.trim();
    if (!trimmed || customIngredients.includes(trimmed)) return;
    setCustomIngredients([...customIngredients, trimmed]);
    setInput('');
  };

  const generateAI = async () => {
    const ings = usePantry ? pantryItems.map(i => i.ingredient) : customIngredients;
    if (ings.length === 0) return toast.error('No ingredients available');
    setGenerating(true);
    try {
      const { data } = await api.post('/ai/generate-recipe', { ingredients: ings, preferences: { cuisine: cuisine !== 'Any' ? cuisine : undefined } });
      toast.success('AI Recipe generated! 🤖');
      router.push(`/recipes/${data._id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'AI generation failed');
    }
    finally { setGenerating(false); }
  };

  const surpriseMe = () => {
    const source = filtered.length ? filtered : matches;
    if (!source.length) {
      toast.error('No recipes to surprise you with yet. Try Find Matches first.');
      return;
    }
    const picked = source[Math.floor(Math.random() * source.length)];
    toast.success(`Surprise pick: ${picked.recipe.title}`);
    router.push(`/recipes/${picked.recipe._id}`);
  };

  const filtered = matches.filter(m => {
    if (filter === 'Can Cook Now') return m.canCookNow;
    if (filter === 'One Away') return m.oneMissing && !m.canCookNow;
    if (filter === 'Quick (<15 min)') return (m.recipe.prepTime + m.recipe.cookTime) <= 15;
    return true;
  });
  const pantryIQ = stats.totalChecked ? Math.round((stats.canCookNow / Math.max(1, stats.totalChecked)) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-brand" /> What Can I Cook?
          </h1>
          <p className="text-gray-400 mt-1">Based on what's in your fridge right now</p>
        </div>

        {/* Toggle & Cuisine */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="glass rounded-xl p-1 flex">
            {['Use My Fridge', 'Custom Ingredients'].map((label, i) => (
              <button key={i} onClick={() => setUsePantry(i === 0)}
                className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  (i === 0) === usePantry ? 'bg-brand text-white' : 'text-gray-400 hover:text-white')}>
                {label}
              </button>
            ))}
          </div>
          <select value={cuisine} onChange={e => setCuisine(e.target.value)}
            className="input w-40 py-2 text-sm">
            {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={search} className="btn-primary flex items-center gap-2 py-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Find Matches
          </button>
          <button onClick={generateAI} disabled={generating} className="btn-ghost flex items-center gap-2 py-2 border-brand/30 text-brand hover:bg-brand/10">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChefHat className="w-4 h-4" />} AI Generate
          </button>
          <button onClick={surpriseMe} className="btn-ghost flex items-center gap-2 py-2">
            <Shuffle className="w-4 h-4" /> Surprise Me
          </button>
        </div>

        {/* Custom ingredient input */}
        {!usePantry && (
          <div className="mb-6">
            <div className="flex gap-2 mb-3">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addIngredient()}
                placeholder="Type an ingredient and press Enter..." className="input flex-1" />
              <button onClick={addIngredient} className="btn-primary px-4"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {customIngredients.map(ing => (
                <span key={ing} className="badge bg-brand/15 text-brand border border-brand/20">
                  {ing}
                  <button onClick={() => setCustomIngredients(c => c.filter(x => x !== ing))}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pantry summary */}
        {usePantry && pantryItems.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {pantryItems.slice(0, 12).map(item => (
              <span key={item._id} className="badge bg-forest/30 text-green-300 border border-forest/30">{item.ingredient}</span>
            ))}
            {pantryItems.length > 12 && <span className="badge bg-surface-muted text-gray-400">+{pantryItems.length - 12} more</span>}
          </div>
        )}

        {/* Stats bar */}
        {matches.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Can Cook Now', val: stats.canCookNow, color: 'text-green-400', bg: 'bg-green-400/10' },
              { label: 'One Away', val: stats.oneMissing, color: 'text-brand', bg: 'bg-brand/10' },
              { label: 'Recipes Checked', val: stats.totalChecked, color: 'text-gray-300', bg: 'bg-surface-muted/20' },
              { label: 'Pantry IQ', val: `${pantryIQ}%`, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            ].map(({ label, val, color, bg }) => (
              <div key={label} className={`card p-4 text-center ${bg}`}>
                <div className={`text-2xl font-bold ${color}`}>{val}</div>
                <div className="text-xs text-gray-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={clsx('px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                filter === cat ? 'bg-brand text-white' : 'bg-surface-card text-gray-400 hover:text-white border border-surface-border')}>
              {cat}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin text-brand mb-3" />
            <p>Finding your matches...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <ChefHat className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No matches found. Try adding more ingredients or let AI generate a recipe!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filtered.map((match, i) => (
                <motion.div key={match.recipe._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }} exit={{ opacity: 0 }}
                  className="card p-4 flex gap-4 hover:border-brand/30 transition-all cursor-pointer group"
                  onClick={() => router.push(`/recipes/${match.recipe._id}`)}>
                  {/* Image */}
                  <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-surface-muted">
                    {match.recipe.images?.[0] && (
                      <img src={match.recipe.images[0]} alt={match.recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-brand transition-colors truncate">{match.recipe.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{match.recipe.prepTime + match.recipe.cookTime} min</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{match.recipe.servings} servings</span>
                          <span className="capitalize">{match.recipe.difficulty}</span>
                        </div>
                      </div>
                      <MatchScoreRing score={match.score} />
                    </div>
                    {/* Matched / Missing */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {match.matchedIngredients.slice(0, 4).map((ing: string) => (
                        <span key={ing} className="badge bg-green-400/10 text-green-400 text-[10px]">✓ {ing}</span>
                      ))}
                      {match.missingIngredients.slice(0, 3).map((ing: string) => (
                        <span key={ing} className="badge bg-red-400/10 text-red-400 text-[10px]">
                          <ShoppingCart className="w-2.5 h-2.5" /> {ing}
                        </span>
                      ))}
                    </div>
                    {/* Tags */}
                    <div className="flex gap-2 mt-2">
                      {match.canCookNow && <span className="badge bg-green-500/10 text-green-400 border border-green-500/20 text-[10px]"><Flame className="w-2.5 h-2.5" /> Cook Now</span>}
                      {match.oneMissing && !match.canCookNow && <span className="badge bg-brand/10 text-brand border border-brand/20 text-[10px]">1 ingredient away</span>}
                      <span className="badge bg-surface-muted/30 text-gray-400 text-[10px]">{match.recipe.cuisine}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
