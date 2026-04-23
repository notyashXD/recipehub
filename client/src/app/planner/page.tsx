'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import { CalendarDays, Plus, Loader2, Trash2, ShoppingCart, Check } from 'lucide-react';
import { format, startOfWeek, addDays, parseISO } from 'date-fns';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function PlannerPage() {
  const { user } = useAuthStore();
  const [plan, setPlan] = useState<any>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [addingSlot, setAddingSlot] = useState<{ date: string; mealType: string } | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState('');
  const [shopping, setShopping] = useState<any[]>([]);
  const [showShopping, setShowShopping] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/planner', { params: { weekStart: weekStart.toISOString() } }),
      api.get('/recipes', { params: { limit: 50 } }),
    ]).then(([planRes, recipeRes]) => {
      setPlan(planRes.data[0] || null);
      setRecipes(recipeRes.data.recipes);
    }).finally(() => setLoading(false));
  }, []);

  const addMeal = async () => {
    if (!addingSlot || !selectedRecipe) return;
    try {
      let currentPlan = plan;
      if (!currentPlan) {
        const { data } = await api.post('/planner', { weekStart: weekStart.toISOString(), meals: [] });
        currentPlan = data;
      }
      const { data } = await api.post(`/planner/${currentPlan._id}/meals`, {
        date: addingSlot.date, mealType: addingSlot.mealType, recipe: selectedRecipe, servings: 2,
      });
      setPlan(data);
      setAddingSlot(null);
      setSelectedRecipe('');
      toast.success('Meal added to plan!');
    } catch { toast.error('Failed to add meal'); }
  };

  const removeMeal = async (mealId: string) => {
    if (!plan) return;
    try {
      const { data } = await api.delete(`/planner/${plan._id}/meals/${mealId}`);
      setPlan(data);
    } catch { toast.error('Failed to remove meal'); }
  };

  const generateShopping = async () => {
    if (!plan) return;
    try {
      const { data } = await api.post(`/planner/${plan._id}/shopping-list`);
      setShopping(data.shoppingList);
      setShowShopping(true);
      toast.success('Shopping list generated!');
    } catch { toast.error('Failed'); }
  };

  const toggleItem = async (itemId: string) => {
    if (!plan) return;
    try {
      const items = await api.put(`/planner/${plan._id}/shopping-list/${itemId}`);
      setShopping(items.data);
    } catch {}
  };

  const getMealsForSlot = (date: string, mealType: string) => {
    return plan?.meals?.filter((m: any) => m.date === date && m.mealType === mealType) || [];
  };

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
              <CalendarDays className="w-8 h-8 text-brand" /> Meal Planner
            </h1>
            <p className="text-gray-400 mt-1">Week of {format(weekStart, 'MMM d, yyyy')}</p>
          </div>
          <button onClick={generateShopping} className="btn-primary flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" /> Generate Shopping List
          </button>
        </div>

        {/* Calendar grid */}
        <div className="card overflow-hidden mb-6">
          {/* Header */}
          <div className="grid grid-cols-8 border-b border-surface-border">
            <div className="p-3 text-xs text-gray-500 font-medium" />
            {DAYS.map((day, i) => (
              <div key={day} className="p-3 text-center">
                <div className="text-xs text-gray-500 font-medium">{day}</div>
                <div className="text-sm font-semibold text-white mt-0.5">{format(addDays(weekStart, i), 'd')}</div>
              </div>
            ))}
          </div>

          {/* Rows */}
          {MEAL_TYPES.map(mealType => (
            <div key={mealType} className="grid grid-cols-8 border-b border-surface-border last:border-0">
              <div className="p-3 flex items-center">
                <span className="text-xs text-gray-400 capitalize font-medium">{mealType}</span>
              </div>
              {DAYS.map((_, i) => {
                const date = format(addDays(weekStart, i), 'yyyy-MM-dd');
                const meals = getMealsForSlot(date, mealType);
                return (
                  <div key={i} className="p-1.5 border-l border-surface-border min-h-[70px]">
                    {meals.map((meal: any) => (
                      <div key={meal._id} className="group relative bg-brand/10 border border-brand/20 rounded-lg p-1.5 mb-1">
                        <div className="text-[10px] text-white font-medium leading-tight line-clamp-2">
                          {meal.recipe?.title || 'Recipe'}
                        </div>
                        <button onClick={() => removeMeal(meal._id)}
                          className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 text-red-400">
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => setAddingSlot({ date, mealType })}
                      className="w-full h-6 flex items-center justify-center text-gray-600 hover:text-brand hover:bg-brand/5 rounded-lg transition-all">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Add meal modal */}
        {addingSlot && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="card p-6 w-full max-w-md">
              <h3 className="font-semibold text-white mb-1">Add {addingSlot.mealType}</h3>
              <p className="text-sm text-gray-400 mb-4">{format(parseISO(addingSlot.date), 'EEEE, MMM d')}</p>
              <select className="input mb-4" value={selectedRecipe} onChange={e => setSelectedRecipe(e.target.value)}>
                <option value="">Select a recipe...</option>
                {recipes.map(r => <option key={r._id} value={r._id}>{r.title}</option>)}
              </select>
              <div className="flex gap-2">
                <button onClick={addMeal} disabled={!selectedRecipe} className="btn-primary flex-1 disabled:opacity-40">Add Meal</button>
                <button onClick={() => setAddingSlot(null)} className="btn-ghost">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Shopping list */}
        {showShopping && shopping.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-brand" /> Shopping List</h3>
              <button onClick={() => setShowShopping(false)} className="text-gray-500 hover:text-gray-300 text-sm">Hide</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {shopping.map((item: any) => (
                <button key={item._id} onClick={() => toggleItem(item._id)}
                  className={`flex items-center gap-2 p-3 rounded-xl text-left transition-all border ${item.checked ? 'bg-green-500/10 border-green-500/20 text-gray-500 line-through' : 'bg-surface-card border-surface-border text-gray-200 hover:border-brand/30'}`}>
                  {item.checked ? <Check className="w-4 h-4 text-green-400 flex-shrink-0" /> : <div className="w-4 h-4 rounded border border-gray-600 flex-shrink-0" />}
                  <div>
                    <div className="text-sm capitalize">{item.ingredient}</div>
                    <div className="text-xs text-gray-500">{item.quantity} {item.unit}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
