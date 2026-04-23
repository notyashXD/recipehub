'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Users, Heart, GitFork, Clock, Star, TrendingUp, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function CommunityPage() {
  const router = useRouter();
  const [feed, setFeed] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [chefs, setChefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    Promise.all([
      api.get('/community/feed', { params: { sort: sortBy, limit: 20 } }),
      api.get('/community/trending'),
      api.get('/community/top-chefs'),
    ]).then(([feedRes, trendRes, chefRes]) => {
      setFeed(feedRes.data.recipes);
      setTrending(trendRes.data);
      setChefs(chefRes.data);
    }).catch(() => toast.error('Failed to load community'))
      .finally(() => setLoading(false));
  }, [sortBy]);

  const BADGES: Record<string, string> = { 'first-cook': '🍳', 'week-streak': '🔥', 'chef-in-training': '👨‍🍳', 'master-chef': '⭐' };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-brand" /> Community
          </h1>
          <p className="text-gray-400 mt-1">Discover recipes from fellow cooks</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feed */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">Recipe Feed</h2>
              <div className="flex gap-1">
                {['popular', 'newest', 'trending'].map(s => (
                  <button key={s} onClick={() => setSortBy(s)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${sortBy === s ? 'bg-brand text-white' : 'text-gray-400 hover:text-white'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {loading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div> : (
              <div className="space-y-3">
                {feed.map((recipe, i) => (
                  <motion.div key={recipe._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="card p-4 flex gap-4 cursor-pointer hover:border-brand/30 transition-all group"
                    onClick={() => router.push(`/recipes/${recipe._id}`)}>
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                      {recipe.images?.[0] && <img src={recipe.images[0]} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white group-hover:text-brand transition-colors truncate">{recipe.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">by {recipe.author?.username} · {recipe.cuisine}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-400" />{recipe.likes?.length || 0}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{recipe.prepTime + recipe.cookTime}m</span>
                        {recipe.averageRating > 0 && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" />{recipe.averageRating.toFixed(1)}</span>}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending */}
            <div className="card p-4">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-brand" /> Trending This Week</h3>
              <div className="space-y-2">
                {trending.slice(0, 5).map((r, i) => (
                  <button key={r._id} onClick={() => router.push(`/recipes/${r._id}`)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-surface-muted/30 transition-all text-left">
                    <span className="text-brand font-bold w-5 text-sm">{i + 1}</span>
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                      {r.images?.[0] && <img src={r.images[0]} className="w-full h-full object-cover" alt={r.title} />}
                    </div>
                    <span className="text-sm text-gray-200 truncate flex-1">{r.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Top Chefs */}
            <div className="card p-4">
              <h3 className="font-semibold text-white mb-3">Top Chefs</h3>
              <div className="space-y-3">
                {chefs.slice(0, 5).map(chef => (
                  <div key={chef._id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-forest flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {chef.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{chef.username}</p>
                      <p className="text-xs text-gray-500">{chef.totalRecipesCooked} cooked · 🔥{chef.streakDays}d</p>
                    </div>
                    <div className="flex gap-1">
                      {chef.badges?.slice(0, 2).map((b: string) => <span key={b} title={b}>{BADGES[b] || '🏅'}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
