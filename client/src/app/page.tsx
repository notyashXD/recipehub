'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChefHat, Sparkles, Bot, Refrigerator, WandSparkles, ArrowRight, Flame } from 'lucide-react';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { useAuthStore } from '@/stores/authStore';

const FLOATING_RECIPES = [
  { title: 'Greek Salad', time: '10m', tag: 'Mediterranean', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&v=2' },
  { title: 'Margherita Pizza', time: '20m', tag: 'Italian', image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=800&v=3' },
  { title: 'Paneer Tikka', time: '30m', tag: 'Indian', image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800' },
  { title: 'Chocolate Lava Cake', time: '27m', tag: 'French', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&v=2' },
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
              <Link href={user ? '/cook' : '/signup'} className="btn-primary inline-flex items-center justify-center gap-2 px-10 py-3 text-lg w-full sm:w-auto">
                {user ? 'Continue cooking' : 'Start for free'} <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="mt-7 flex items-center gap-4 text-sm text-gray-400">
              <span className="inline-flex items-center gap-1"><Flame className="w-4 h-4 text-orange-400" /> Daily streak tracking</span>
              <span>•</span>
              <span>AI recipes by your ingredients</span>
            </div>
          </div>

          <div className="relative h-[440px] hidden md:block">
            {FLOATING_RECIPES.map((recipe, index) => {
              const positions = [
                { left: '5%', top: '20px' },
                { left: '55%', top: '60px' },
                { left: '15%', top: '210px' },
                { left: '60%', top: '230px' },
              ];
              const pos = positions[index];

              return (
                <motion.div
                  key={recipe.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: [0, -10, 0] }}
                  transition={{ 
                    delay: index * 0.15, 
                    duration: 4 + index, 
                    repeat: Infinity, 
                    repeatType: 'mirror',
                    ease: "easeInOut"
                  }}
                  className="absolute card w-52 overflow-hidden shadow-2xl border-surface-border/50"
                  style={{ left: pos.left, top: pos.top }}
                >
                  <div className="h-28 w-full bg-surface-muted relative">
                    <img 
                      src={recipe.image} 
                      alt={recipe.title} 
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  <div className="p-3 bg-surface-card">
                    <p className="text-white font-semibold text-sm truncate">{recipe.title}</p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400">
                      <span>{recipe.tag}</span>
                      <span>{recipe.time}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="pb-14">
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
      </main>

      <footer className="max-w-6xl mx-auto px-6 pb-12 pt-6 relative z-20 border-t border-surface-border/30">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span>Made with ❤️ by</span>
            <span className="text-white font-semibold">Yash Mishra</span>
          </div>
          <div className="px-4 py-1.5 rounded-full bg-brand/5 border border-brand/15 text-brand/80 font-medium tracking-wide">
            "By Foodie For Foodies"
          </div>
          <div className="text-[11px] opacity-40">
            © 2026 RecipeHub Project
          </div>
        </div>
      </footer>
    </div>
  );
}
