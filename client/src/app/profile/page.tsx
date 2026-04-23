'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import { User, Flame, Trophy, ChefHat, BookOpen, Star, Loader2, Edit2, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const BADGE_INFO: Record<string, { label: string; emoji: string; desc: string }> = {
  'first-cook': { label: 'First Cook', emoji: '🍳', desc: 'Cooked your first recipe' },
  'week-streak': { label: 'Week Streak', emoji: '🔥', desc: '7 day cooking streak' },
  'chef-in-training': { label: 'Chef in Training', emoji: '👨‍🍳', desc: 'Cooked 10 recipes' },
  'master-chef': { label: 'Master Chef', emoji: '⭐', desc: 'Cooked 50 recipes' },
};

const LEVELS = ['beginner', 'intermediate', 'advanced'];
const DIETS = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'halal'];

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ bio: '', cookingLevel: 'beginner', dietaryPreferences: [] as string[] });

  useEffect(() => {
    Promise.all([api.get('/auth/me'), api.get('/recipes/my/history')]).then(([meRes, histRes]) => {
      setProfile(meRes.data);
      setHistory(histRes.data);
      setForm({ bio: meRes.data.bio || '', cookingLevel: meRes.data.cookingLevel || 'beginner', dietaryPreferences: meRes.data.dietaryPreferences || [] });
    }).finally(() => setLoading(false));
  }, []);

  const saveProfile = async () => {
    try {
      const { data } = await api.put('/auth/profile', form);
      setProfile(data); updateUser(form);
      setEditing(false); toast.success('Profile updated!');
    } catch { toast.error('Update failed'); }
  };

  const toggleDiet = (diet: string) => {
    setForm(f => ({ ...f, dietaryPreferences: f.dietaryPreferences.includes(diet) ? f.dietaryPreferences.filter(d => d !== diet) : [...f.dietaryPreferences, diet] }));
  };

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <User className="w-8 h-8 text-brand" /> My Profile
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile card */}
          <div className="md:col-span-1 space-y-4">
            <div className="card p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand to-forest flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4">
                {profile?.username?.[0]?.toUpperCase()}
              </div>
              <h2 className="font-semibold text-white text-lg">{profile?.username}</h2>
              <p className="text-sm text-gray-400">{profile?.email}</p>
              {profile?.bio && <p className="text-sm text-gray-300 mt-2">{profile.bio}</p>}
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="badge bg-brand/10 text-brand border border-brand/20 capitalize">{profile?.cookingLevel}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="card p-4 grid grid-cols-2 gap-3">
              {[
                { label: 'Cooked', val: profile?.totalRecipesCooked || 0, icon: ChefHat, color: 'text-brand' },
                { label: 'Streak', val: `${profile?.streakDays || 0}d`, icon: Flame, color: 'text-orange-400' },
                { label: 'Recipes', val: profile?.savedRecipes?.length || 0, icon: BookOpen, color: 'text-blue-400' },
                { label: 'Badges', val: profile?.badges?.length || 0, icon: Trophy, color: 'text-yellow-400' },
              ].map(({ label, val, icon: Icon, color }) => (
                <div key={label} className="text-center p-2 bg-surface-muted/10 rounded-xl">
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
                  <div className="font-bold text-white text-lg">{val}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              ))}
            </div>

            {/* Badges */}
            <div className="card p-4">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-400" /> Badges</h3>
              {profile?.badges?.length === 0 ? (
                <p className="text-sm text-gray-500">Cook recipes to earn badges!</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {profile?.badges?.map((badge: string) => {
                    const info = BADGE_INFO[badge] || { emoji: '🏅', label: badge, desc: '' };
                    return (
                      <div key={badge} className="flex flex-col items-center p-2 bg-yellow-400/5 border border-yellow-400/15 rounded-xl">
                        <span className="text-2xl mb-1">{info.emoji}</span>
                        <span className="text-xs font-medium text-yellow-300 text-center">{info.label}</span>
                        <span className="text-[10px] text-gray-500 text-center">{info.desc}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Edit + History */}
          <div className="md:col-span-2 space-y-6">
            {/* Edit profile */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Edit Profile</h3>
                {editing
                  ? <button onClick={saveProfile} className="btn-primary py-1.5 px-4 text-sm flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Save</button>
                  : <button onClick={() => setEditing(true)} className="btn-ghost py-1.5 px-4 text-sm flex items-center gap-1"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                }
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1.5">Bio</label>
                  <textarea disabled={!editing} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
                    className="input resize-none h-20 disabled:opacity-60" placeholder="Tell the community about yourself..." />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1.5">Cooking Level</label>
                  <div className="flex gap-2">
                    {LEVELS.map(l => (
                      <button key={l} onClick={() => editing && setForm({ ...form, cookingLevel: l })} disabled={!editing}
                        className={`flex-1 py-2 rounded-xl text-sm capitalize font-medium transition-all border ${form.cookingLevel === l ? 'bg-brand/20 text-brand border-brand/30' : 'bg-surface-card text-gray-400 border-surface-border'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1.5">Dietary Preferences</label>
                  <div className="flex flex-wrap gap-2">
                    {DIETS.map(d => (
                      <button key={d} onClick={() => editing && toggleDiet(d)} disabled={!editing}
                        className={`badge capitalize border cursor-pointer transition-all ${form.dietaryPreferences.includes(d) ? 'bg-forest/30 text-green-300 border-forest/30' : 'bg-surface-card text-gray-400 border-surface-border'}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Cook history */}
            <div className="card p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><ChefHat className="w-4 h-4 text-brand" /> Cook History</h3>
              {history.length === 0 ? (
                <p className="text-gray-500 text-sm">No cooking history yet. Start cooking!</p>
              ) : (
                <div className="space-y-3">
                  {history.slice(0, 10).map((h: any, i: number) => (
                    <motion.div key={h._id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-3 bg-surface-muted/10 rounded-xl">
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                        {h.recipe?.images?.[0] && <img src={h.recipe.images[0]} className="w-full h-full object-cover" alt="" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{h.recipe?.title}</p>
                        <p className="text-xs text-gray-500">{new Date(h.cookedAt).toLocaleDateString()}</p>
                      </div>
                      {h.rating && (
                        <div className="flex items-center gap-1 text-yellow-400 text-sm">
                          <Star className="w-3.5 h-3.5" />{h.rating}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
