'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, ChefHat, Loader2, ArrowLeft, Sparkles } from 'lucide-react';

const CATEGORIES = ['protein', 'vegetable', 'fruit', 'dairy', 'grain', 'spice', 'oil', 'other'];
const CUISINES = ['Italian', 'Indian', 'Asian', 'American', 'Mediterranean', 'French', 'Mexican', 'International'];
const DIETS = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'halal'];

const emptyIng = () => ({ name: '', quantity: 1, unit: 'piece', category: 'vegetable', isOptional: false, substitutes: [] as string[] });
const emptyStep = (order: number) => ({ order, instruction: '', duration: 5 });

export default function CreateRecipePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', cuisine: 'International', difficulty: 'intermediate',
    prepTime: 10, cookTime: 20, servings: 4, isPublic: true,
    dietaryTags: [] as string[],
    tags: '',
    images: [''],
  });
  const [ingredients, setIngredients] = useState([emptyIng()]);
  const [steps, setSteps] = useState([emptyStep(1)]);
  const [nutrition, setNutrition] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  const toggleDiet = (d: string) =>
    setForm(f => ({ ...f, dietaryTags: f.dietaryTags.includes(d) ? f.dietaryTags.filter(x => x !== d) : [...f.dietaryTags, d] }));

  const addIngredient = () => setIngredients(i => [...i, emptyIng()]);
  const removeIngredient = (idx: number) => setIngredients(i => i.filter((_, j) => j !== idx));
  const updateIngredient = (idx: number, field: string, value: any) =>
    setIngredients(i => i.map((ing, j) => j === idx ? { ...ing, [field]: value } : ing));

  const addStep = () => setSteps(s => [...s, emptyStep(s.length + 1)]);
  const removeStep = (idx: number) => setSteps(s => s.filter((_, j) => j !== idx).map((st, j) => ({ ...st, order: j + 1 })));
  const updateStep = (idx: number, field: string, value: any) =>
    setSteps(s => s.map((st, j) => j === idx ? { ...st, [field]: value } : st));

  // AI: auto-fill recipe details from title
  const aiAutofill = async () => {
    if (!form.title.trim()) return toast.error('Enter a recipe title first');
    setAiLoading(true);
    try {
      const { data } = await api.post('/ai/generate-recipe', {
        ingredients: ingredients.filter(i => i.name).map(i => i.name),
        preferences: { cuisine: form.cuisine, difficulty: form.difficulty },
      });
      setIngredients(data.ingredients || [emptyIng()]);
      setSteps(data.steps || [emptyStep(1)]);
      setNutrition(data.nutrition || nutrition);
      setForm(f => ({
        ...f,
        description: data.description || f.description,
        dietaryTags: data.dietaryTags || f.dietaryTags,
        prepTime: data.prepTime || f.prepTime,
        cookTime: data.cookTime || f.cookTime,
        servings: data.servings || f.servings,
      }));
      toast.success('AI filled in recipe details!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'AI autofill failed');
    }
    finally { setAiLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ingredients.filter(i => i.name.trim()).length === 0) return toast.error('Add at least one ingredient');
    if (steps.filter(s => s.instruction.trim()).length === 0) return toast.error('Add at least one step');
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        images: form.images.filter(Boolean),
        ingredients: ingredients.filter(i => i.name.trim()),
        steps: steps.filter(s => s.instruction.trim()),
        nutrition,
      };
      const { data } = await api.post('/recipes', payload);
      toast.success('Recipe created! 🎉');
      router.push(`/recipes/${data._id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create recipe');
    } finally { setLoading(false); }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="btn-ghost mb-6 flex items-center gap-2 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
            <ChefHat className="w-8 h-8 text-brand" /> Create Recipe
          </h1>
          <button type="button" onClick={aiAutofill} disabled={aiLoading} className="btn-ghost flex items-center gap-2 text-purple-400 border-purple-400/20 hover:bg-purple-400/10">
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            AI Autofill
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-white text-lg">Basic Info</h2>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Recipe Title *</label>
              <input className="input" placeholder="e.g. Creamy Mushroom Pasta" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Description *</label>
              <textarea className="input h-24 resize-none" placeholder="Describe your recipe..."
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Cuisine</label>
                <select className="input" value={form.cuisine} onChange={e => setForm({ ...form, cuisine: e.target.value })}>
                  {CUISINES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Difficulty</label>
                <select className="input" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                  {['beginner', 'intermediate', 'advanced'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Prep Time (min)</label>
                <input type="number" className="input" min={0} value={form.prepTime}
                  onChange={e => setForm({ ...form, prepTime: parseInt(e.target.value) })} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Cook Time (min)</label>
                <input type="number" className="input" min={0} value={form.cookTime}
                  onChange={e => setForm({ ...form, cookTime: parseInt(e.target.value) })} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Servings</label>
                <input type="number" className="input" min={1} value={form.servings}
                  onChange={e => setForm({ ...form, servings: parseInt(e.target.value) })} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input type="checkbox" id="isPublic" checked={form.isPublic}
                  onChange={e => setForm({ ...form, isPublic: e.target.checked })}
                  className="w-4 h-4 accent-brand" />
                <label htmlFor="isPublic" className="text-sm text-gray-300">Make Public</label>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Image URL (optional)</label>
              <input className="input" placeholder="https://images.unsplash.com/..." value={form.images[0]}
                onChange={e => setForm({ ...form, images: [e.target.value] })} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Tags (comma separated)</label>
              <input className="input" placeholder="quick, spicy, comfort food" value={form.tags}
                onChange={e => setForm({ ...form, tags: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Dietary Tags</label>
              <div className="flex flex-wrap gap-2">
                {DIETS.map(d => (
                  <button type="button" key={d} onClick={() => toggleDiet(d)}
                    className={`badge capitalize border transition-all ${form.dietaryTags.includes(d) ? 'bg-forest/30 text-green-300 border-forest/40' : 'bg-surface-card text-gray-400 border-surface-border hover:border-gray-500'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white text-lg">Ingredients</h2>
              <button type="button" onClick={addIngredient} className="btn-ghost py-1.5 px-3 text-sm flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="space-y-3">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input className="input col-span-4 text-sm py-2" placeholder="Ingredient *" value={ing.name}
                    onChange={e => updateIngredient(idx, 'name', e.target.value)} />
                  <input type="number" className="input col-span-2 text-sm py-2" placeholder="Qty" value={ing.quantity} min={0}
                    onChange={e => updateIngredient(idx, 'quantity', parseFloat(e.target.value))} />
                  <input className="input col-span-2 text-sm py-2" placeholder="Unit" value={ing.unit}
                    onChange={e => updateIngredient(idx, 'unit', e.target.value)} />
                  <select className="input col-span-3 text-sm py-2" value={ing.category}
                    onChange={e => updateIngredient(idx, 'category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <button type="button" onClick={() => removeIngredient(idx)} disabled={ingredients.length === 1}
                    className="col-span-1 text-red-400 hover:text-red-300 disabled:opacity-30 flex justify-center">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white text-lg">Instructions</h2>
              <button type="button" onClick={addStep} className="btn-ghost py-1.5 px-3 text-sm flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add Step
              </button>
            </div>
            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center text-brand font-bold text-sm flex-shrink-0 mt-1">
                    {step.order}
                  </div>
                  <div className="flex-1 grid grid-cols-12 gap-2">
                    <textarea className="input col-span-9 text-sm py-2 h-16 resize-none" placeholder={`Step ${step.order} instruction...`}
                      value={step.instruction} onChange={e => updateStep(idx, 'instruction', e.target.value)} />
                    <input type="number" className="input col-span-2 text-sm py-2" placeholder="Min" value={step.duration} min={0}
                      onChange={e => updateStep(idx, 'duration', parseInt(e.target.value))} />
                    <button type="button" onClick={() => removeStep(idx)} disabled={steps.length === 1}
                      className="col-span-1 text-red-400 hover:text-red-300 disabled:opacity-30 flex justify-center mt-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nutrition */}
          <div className="card p-6">
            <h2 className="font-semibold text-white text-lg mb-4">Nutrition (per serving, optional)</h2>
            <div className="grid grid-cols-5 gap-3">
              {(['calories', 'protein', 'carbs', 'fat', 'fiber'] as const).map(key => (
                <div key={key}>
                  <label className="block text-xs text-gray-400 mb-1 capitalize">{key}</label>
                  <input type="number" className="input text-sm py-2" min={0} value={(nutrition as any)[key]}
                    onChange={e => setNutrition(n => ({ ...n, [key]: parseInt(e.target.value) || 0 }))} />
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><ChefHat className="w-4 h-4" /> Publish Recipe</>}
            </button>
            <button type="button" onClick={() => router.back()} className="btn-ghost px-6">Cancel</button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
