'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import { Clock, Users, Heart, GitFork, Star, ChefHat, CheckCircle2, Circle, Loader2, ArrowLeft, Sparkles, Timer } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePantryStore } from '@/stores/pantryStore';
import { RadialBarChart, RadialBar, PolarAngleAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { items: pantryItems } = usePantryStore();
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cookMode, setCookMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [improving, setImproving] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/recipes/${id}`);
        setRecipe(data);
        setLiked(data.likes?.some((l: any) => l === user?.id || l._id === user?.id));
        setSaved(user?.id ? false : false); // would check saved recipes
      } catch { toast.error('Recipe not found'); router.push('/recipes'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  const handleLike = async () => {
    try {
      const { data } = await api.post(`/recipes/${id}/like`);
      setLiked(data.liked);
      setRecipe((r: any) => ({ ...r, likes: new Array(data.likesCount).fill(null) }));
    } catch { toast.error('Failed'); }
  };

  const handleCooked = async () => {
    try {
      await api.post(`/recipes/${id}/cooked`, { servingsMade: recipe.servings });
      toast.success('Marked as cooked! 🎉 Streak updated!');
    } catch { toast.error('Failed'); }
  };

  const handleImprove = async () => {
    setImproving(true);
    try {
      const { data } = await api.post('/ai/improve-recipe', { recipeId: id, userNotes: 'General improvements' });
      setSuggestions(data.suggestions);
    } catch { toast.error('AI suggestions failed'); }
    finally { setImproving(false); }
  };

  const pantryNames = pantryItems.map(p => p.ingredient.toLowerCase());
  const hasIngredient = (name: string) => pantryNames.some(p => p.includes(name.toLowerCase()) || name.toLowerCase().includes(p));

  if (loading) return <DashboardLayout><div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div></DashboardLayout>;
  if (!recipe) return null;

  const nutritionData = [
    { name: 'Protein', value: recipe.nutrition?.protein || 0, fill: '#FF6B35' },
    { name: 'Carbs', value: recipe.nutrition?.carbs || 0, fill: '#2D4A3E' },
    { name: 'Fat', value: recipe.nutrition?.fat || 0, fill: '#6366f1' },
  ];

  return (
    <DashboardLayout>
      {cookMode ? (
        /* Cook Mode */
        <div className="min-h-screen bg-surface p-6 flex flex-col items-center justify-center">
          <div className="w-full max-w-lg">
            <button onClick={() => setCookMode(false)} className="btn-ghost mb-6 flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Exit Cook Mode</button>
            <div className="card p-8 text-center">
              <div className="text-brand font-semibold text-sm mb-2">Step {currentStep + 1} of {recipe.steps.length}</div>
              <div className="w-full bg-surface-muted rounded-full h-1.5 mb-6">
                <div className="bg-brand h-1.5 rounded-full transition-all" style={{ width: `${((currentStep + 1) / recipe.steps.length) * 100}%` }} />
              </div>
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-brand/20 border border-brand/30 mx-auto mb-4">
                <span className="text-brand font-bold text-xl">{currentStep + 1}</span>
              </div>
              <p className="text-white text-xl leading-relaxed mb-6">{recipe.steps[currentStep]?.instruction}</p>
              {recipe.steps[currentStep]?.duration > 0 && (
                <div className="flex items-center justify-center gap-2 text-gray-400 mb-8">
                  <Timer className="w-4 h-4" /> ~{recipe.steps[currentStep].duration} min
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setCurrentStep(s => Math.max(0, s - 1))} disabled={currentStep === 0} className="btn-ghost flex-1 disabled:opacity-40">← Previous</button>
                {currentStep < recipe.steps.length - 1
                  ? <button onClick={() => setCurrentStep(s => s + 1)} className="btn-primary flex-1">Next Step →</button>
                  : <button onClick={handleCooked} className="btn-primary flex-1 bg-green-600 hover:bg-green-700">✓ Done! Mark as Cooked</button>
                }
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto p-6">
          <button onClick={() => router.back()} className="btn-ghost mb-6 flex items-center gap-2 text-sm"><ArrowLeft className="w-4 h-4" /> Back</button>

          {/* Hero */}
          <div className="relative h-72 rounded-2xl overflow-hidden mb-6">
            {recipe.images?.[0] && <img src={recipe.images[0]} alt={recipe.title} className="w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex flex-wrap gap-2 mb-2">
                {recipe.isAIGenerated && <span className="badge bg-purple-500/20 text-purple-300 border border-purple-500/30"><Sparkles className="w-3 h-3" /> AI Generated</span>}
                {recipe.dietaryTags?.map((t: string) => <span key={t} className="badge bg-black/40 text-white backdrop-blur-sm text-xs">{t}</span>)}
              </div>
              <h1 className="font-display text-3xl font-bold text-white">{recipe.title}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-300">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{recipe.prepTime + recipe.cookTime} min</span>
                <span className="flex items-center gap-1"><Users className="w-4 h-4" />{recipe.servings} servings</span>
                <span className="flex items-center gap-1"><ChefHat className="w-4 h-4" />{recipe.difficulty}</span>
                <span>{recipe.cuisine}</span>
                {recipe.averageRating > 0 && <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400" />{recipe.averageRating.toFixed(1)}</span>}
              </div>
            </div>
          </div>

          {/* Action bar */}
          <div className="flex flex-wrap gap-3 mb-8">
            <button onClick={() => setCookMode(true)} className="btn-primary flex items-center gap-2"><ChefHat className="w-4 h-4" /> Start Cooking</button>
            <button onClick={handleLike} className={`btn-ghost flex items-center gap-2 ${liked ? 'text-red-400 border-red-400/30' : ''}`}>
              <Heart className={`w-4 h-4 ${liked ? 'fill-red-400 text-red-400' : ''}`} /> {recipe.likes?.length || 0}
            </button>
            <button onClick={() => api.post(`/recipes/${id}/fork`).then(() => toast.success('Recipe forked!'))} className="btn-ghost flex items-center gap-2">
              <GitFork className="w-4 h-4" /> Fork
            </button>
            <button onClick={handleImprove} disabled={improving} className="btn-ghost flex items-center gap-2 text-purple-400 border-purple-400/20">
              {improving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} AI Improve
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ingredients */}
            <div className="md:col-span-2">
              <h2 className="section-title mb-4">Ingredients</h2>
              <div className="space-y-2">
                {recipe.ingredients?.map((ing: any, i: number) => {
                  const have = hasIngredient(ing.name);
                  const checked = checkedIngredients.has(i);
                  return (
                    <button key={i} onClick={() => setCheckedIngredients(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; })}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${checked ? 'bg-green-500/10 border border-green-500/20' : 'bg-surface-card border border-surface-border hover:border-brand/20'}`}>
                      {checked ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" /> : <Circle className="w-4 h-4 text-gray-600 flex-shrink-0" />}
                      <span className={`flex-1 text-sm ${checked ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                        {ing.name} — {ing.quantity} {ing.unit}
                        {ing.isOptional && <span className="text-xs text-gray-500 ml-1">(optional)</span>}
                      </span>
                      {have ? <span className="text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">In fridge</span>
                        : <span className="text-[10px] text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full">Need this</span>}
                    </button>
                  );
                })}
              </div>

              {/* Steps */}
              <h2 className="section-title mt-8 mb-4">Instructions</h2>
              <div className="space-y-4">
                {recipe.steps?.sort((a: any, b: any) => a.order - b.order).map((step: any, i: number) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                    className="flex gap-4 p-4 card">
                    <div className="w-8 h-8 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center flex-shrink-0 text-brand font-bold text-sm">{step.order}</div>
                    <div className="flex-1">
                      <p className="text-gray-200 text-sm leading-relaxed">{step.instruction}</p>
                      {step.duration > 0 && <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Timer className="w-3 h-3" />{step.duration} min</p>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Sidebar: Nutrition + AI suggestions */}
            <div className="space-y-4">
              {/* Nutrition */}
              <div className="card p-4">
                <h3 className="font-semibold text-white mb-3">Nutrition (per serving)</h3>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart innerRadius="40%" outerRadius="80%" data={nutritionData} startAngle={90} endAngle={-270}>
                      <PolarAngleAxis type="number" domain={[0, Math.max(...nutritionData.map(d => d.value))]} tick={false} />
                      <RadialBar dataKey="value" cornerRadius={4} />
                      <Tooltip contentStyle={{ background: '#1A1D27', border: '1px solid #2A2D3A', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Calories', val: recipe.nutrition?.calories, unit: 'kcal', color: 'text-white' },
                    { label: 'Protein', val: recipe.nutrition?.protein, unit: 'g', color: 'text-brand' },
                    { label: 'Carbs', val: recipe.nutrition?.carbs, unit: 'g', color: 'text-green-400' },
                    { label: 'Fat', val: recipe.nutrition?.fat, unit: 'g', color: 'text-purple-400' },
                  ].map(({ label, val, unit, color }) => (
                    <div key={label} className="text-center p-2 bg-surface-muted/20 rounded-lg">
                      <div className={`font-bold ${color}`}>{val || 0}{unit}</div>
                      <div className="text-xs text-gray-500">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Suggestions */}
              {suggestions.length > 0 && (
                <div className="card p-4">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-400" /> AI Variations</h3>
                  <div className="space-y-3">
                    {suggestions.map((s: any, i: number) => (
                      <div key={i} className="p-3 bg-purple-500/5 border border-purple-500/15 rounded-xl">
                        <div className="text-xs font-semibold text-purple-400 mb-1 capitalize">{s.type}</div>
                        <p className="text-white text-sm font-medium mb-1">{s.title}</p>
                        <p className="text-xs text-gray-400">{s.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Author */}
              {recipe.author && (
                <div className="card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-forest flex items-center justify-center text-white font-bold">
                    {recipe.author.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{recipe.author.username}</p>
                    <p className="text-xs text-gray-500 capitalize">{recipe.author.cookingLevel} chef</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
