'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { BookOpen, Search, Clock, Star, Heart, Loader2, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

const SORTS = ['newest', 'popular', 'rating', 'quick'];
const CUISINES = ['', 'Italian', 'Indian', 'Asian', 'American', 'Mediterranean', 'French', 'Mexican'];
const DIETS = ['', 'vegetarian', 'vegan', 'gluten-free', 'dairy-free'];

export default function RecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [cuisine, setCuisine] = useState('');
  const [diet, setDiet] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/recipes', { params: { search: search || undefined, sort, cuisine: cuisine || undefined, diet: diet || undefined, page, limit: 20 } });
      setRecipes(data.recipes);
      setTotal(data.total);
    } catch { toast.error('Failed to load recipes'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRecipes(); }, [sort, cuisine, diet, page]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); fetchRecipes(); };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-brand" /> Recipes
            </h1>
            <p className="text-gray-400 mt-1">{total} recipes in the collection</p>
          </div>
          <button onClick={() => router.push('/recipes/create')} className="btn-primary">+ Create Recipe</button>
        </div>

        {/* Search & Filters */}
        <div className="card p-4 mb-6 space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input className="input pl-10" placeholder="Search recipes..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary px-5">Search</button>
          </form>
          <div className="flex flex-wrap gap-2">
            <select className="input w-36 py-2 text-sm" value={sort} onChange={e => setSort(e.target.value)}>
              {SORTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <select className="input w-40 py-2 text-sm" value={cuisine} onChange={e => setCuisine(e.target.value)}>
              <option value="">All Cuisines</option>
              {CUISINES.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="input w-40 py-2 text-sm" value={diet} onChange={e => setDiet(e.target.value)}>
              <option value="">All Diets</option>
              {DIETS.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <AnimatePresence>
              {recipes.map((recipe, i) => (
                <motion.div key={recipe._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="card overflow-hidden cursor-pointer group hover:border-brand/30 transition-all"
                  onClick={() => router.push(`/recipes/${recipe._id}`)}>
                  <div className="relative h-40 bg-surface-muted overflow-hidden">
                    {recipe.images?.[0] && <img src={recipe.images[0]} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-2 flex gap-1">
                      {recipe.dietaryTags?.slice(0, 2).map((tag: string) => (
                        <span key={tag} className="badge bg-black/50 text-white text-[9px] backdrop-blur-sm">{tag}</span>
                      ))}
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
                      <Heart className="w-3 h-3 text-red-400" />
                      <span className="text-white text-xs">{recipe.likes?.length || 0}</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-white text-sm leading-tight mb-1 group-hover:text-brand transition-colors line-clamp-2">{recipe.title}</h3>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{recipe.prepTime + recipe.cookTime}m</span>
                      {recipe.averageRating > 0 && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" />{recipe.averageRating.toFixed(1)}</span>}
                      <span className="text-gray-500">{recipe.cuisine}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex justify-center gap-2 mt-8">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost px-4 disabled:opacity-40">← Prev</button>
            <span className="flex items-center px-4 text-gray-400 text-sm">Page {page} of {Math.ceil(total / 20)}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)} className="btn-ghost px-4 disabled:opacity-40">Next →</button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
