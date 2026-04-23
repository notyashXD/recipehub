'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChefHat, Sparkles, Bot, Refrigerator, WandSparkles, ArrowRight, Flame } from 'lucide-react';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { useAuthStore } from '@/stores/authStore';

const FLOATING_RECIPES = [
  { title: 'Butter Chicken', time: '45m', tag: 'Indian', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800' },
  { title: 'Mushroom Risotto', time: '40m', tag: 'Italian', image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db171?w=800' },
  { title: 'Greek Salad', time: '10m', tag: 'Mediterranean', image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800' },
  { title: 'Chocolate Lava Cake', time: '27m', tag: 'French', image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=800' },
];

const FEATURES = [
  {
    title: 'Ingredient-first matching',
    description: 'Find what you can cook right now from your pantry and fridge in seconds.',
    icon: Sparkles,
  },
  {
    title: 'AI Chef companion',
    description: 'Ask for substitutions, timing, techniques, and instant cooking guidance.',
    icon: Bot,
  },
  {
    title: 'Fridge photo intelligence',
    description: 'Scan ingredients with Gemini-powered vision and auto-add them to your pantry.',
    icon: Refrigerator,
  },
  {
    title: 'Creative recipe generation',
    description: 'Turn your exact ingredients into tailored AI recipes with cuisine preferences.',
    icon: WandSparkles,
  },
];

export default function HomePage() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-surface relative overflow-hidden">
      <ThemeToggle className="absolute right-5 top-5 z-30" />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute top-40 -right-24 h-72 w-72 rounded-full bg-forest/20 blur-3xl" />
      </div>

      <header className="max-w-6xl mx-auto px-6 pt-8 pb-2 relative z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/20 border border-brand/30 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-brand" />
          </div>
          <span className="font-display text-2xl text-white font-bold">RecipeHub</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost py-2 px-4 text-sm">Sign in</Link>
          <Link href="/signup" className="btn-primary py-2 px-4 text-sm">Get started</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 relative z-20">
        <section className="pt-10 pb-14 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="badge bg-brand/10 text-brand border border-brand/25 mb-4">Cook smarter, waste less</span>
            <h1 className="font-display text-5xl md:text-6xl text-white font-bold leading-tight">
              Your AI kitchen copilot.
            </h1>
            <p className="text-gray-300 text-lg mt-5 max-w-xl">
              <span className="font-semibold text-white">Brand motto: From ingredients to incredible meals.</span>{' '}
              RecipeHub helps you discover recipes, plan meals, and cook with confidence using AI that
              understands your pantry.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <Link href={user ? '/cook' : '/signup'} className="btn-primary inline-flex items-center gap-2">
                {user ? 'Continue cooking' : 'Start for free'} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/app" className="btn-ghost inline-flex items-center gap-2">
                Open classic entry
              </Link>
            </div>
            <div className="mt-7 flex items-center gap-4 text-sm text-gray-400">
              <span className="inline-flex items-center gap-1"><Flame className="w-4 h-4 text-orange-400" /> Daily streak tracking</span>
              <span>•</span>
              <span>AI recipes by your ingredients</span>
            </div>
          </div>

          <div className="relative h-[420px] hidden md:block">
            {FLOATING_RECIPES.map((recipe, index) => (
              <motion.div
                key={recipe.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: [0, -8, 0] }}
                transition={{ delay: index * 0.12, duration: 5 + index, repeat: Infinity, repeatType: 'mirror' }}
                className="absolute card w-56 overflow-hidden shadow-2xl"
                style={{
                  left: `${(index % 2) * 48 + (index === 3 ? 20 : 0)}%`,
                  top: `${index * 20 + (index % 2 ? 20 : 0)}px`,
                }}
              >
                <img src={recipe.image} alt={recipe.title} className="h-28 w-full object-cover" />
                <div className="p-3">
                  <p className="text-white font-semibold text-sm truncate">{recipe.title}</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                    <span>{recipe.tag}</span>
                    <span>{recipe.time}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="pb-10">
          <div className="grid md:grid-cols-2 gap-4">
            {FEATURES.map(({ title, description, icon: Icon }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.08 }}
                className="card p-5"
              >
                <div className="w-10 h-10 rounded-xl bg-brand/15 border border-brand/25 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-brand" />
                </div>
                <h3 className="text-white font-semibold">{title}</h3>
                <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="pb-14">
          <div className="card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <p className="text-white font-semibold">Prefer the previous quick-entry flow?</p>
              <p className="text-sm text-gray-400 mt-1">It still exists inside the product as the classic app entry route.</p>
            </div>
            <Link href="/app" className="btn-ghost inline-flex items-center gap-2">
              Open classic entry <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
