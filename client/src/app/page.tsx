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
        <motion.div 
          animate={{ 
            x: [0, 50, 0], 
            y: [0, 30, 0],
            scale: [1, 1.1, 1] 
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-brand/15 blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            x: [0, -40, 0], 
            y: [0, 60, 0],
            scale: [1, 1.2, 1] 
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 -right-24 h-80 w-80 rounded-full bg-forest/15 blur-[100px]" 
        />
      </div>

      <header className="max-w-6xl mx-auto px-6 pt-8 pb-2 relative z-20 flex items-center justify-between">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <motion.div 
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="w-10 h-10 rounded-xl bg-brand/20 border border-brand/30 flex items-center justify-center group-hover:bg-brand/30 transition-colors"
          >
            <ChefHat className="w-5 h-5 text-brand" />
          </motion.div>
          <span className="font-display text-2xl text-white font-bold tracking-tight">RecipeHub</span>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <Link href="/login" className="btn-ghost py-2 px-4 text-sm">Sign in</Link>
          <Link href="/signup" className="btn-primary py-2 px-4 text-sm shadow-lg shadow-brand/20">Get started</Link>
        </motion.div>
      </header>

      <main className="max-w-6xl mx-auto px-6 relative z-30">
        <section className="pt-16 pb-20 grid lg:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-50"
          >
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="badge bg-brand/10 text-brand border border-brand/25 mb-6 px-4 py-1"
            >
              Cook smarter, waste less
            </motion.span>
            <h1 className="font-display text-5xl md:text-7xl text-white font-bold leading-[1.1] tracking-tight">
              Your AI <br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-orange-400">kitchen copilot.</span>
            </h1>
            <p className="text-gray-400 text-lg mt-6 max-w-xl leading-relaxed">
              <span className="font-semibold text-white/90">From ingredients to incredible meals.</span>{' '}
              RecipeHub helps you discover recipes, plan meals, and cook with confidence using AI that
              understands your pantry.
            </p>
            <div className="flex flex-wrap gap-4 mt-10 relative z-50">
              <Link href={user ? '/cook' : '/signup'} className="btn-primary inline-flex items-center justify-center gap-3 px-10 py-4 text-lg w-full sm:w-auto hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand/25 pointer-events-auto">
                {user ? 'Continue cooking' : 'Start for free'} <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-gray-500">
              <span className="inline-flex items-center gap-2"><Flame className="w-4 h-4 text-orange-500" /> Daily streaks</span>
              <span className="w-1 h-1 rounded-full bg-gray-700" />
              <span>AI Pantry Scanning</span>
            </div>
          </motion.div>

          <div className="relative h-[480px] hidden lg:block pointer-events-none">
            {FLOATING_RECIPES.map((recipe, index) => {
              const positions = [
                { left: '0%', top: '20px' },
                { left: '55%', top: '60px' },
                { left: '10%', top: '230px' },
                { left: '60%', top: '260px' },
              ];
              const pos = positions[index];

              return (
                <motion.div
                  key={recipe.title}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1, y: [0, -15, 0] }}
                  whileHover={{ scale: 1.05, zIndex: 60 }}
                  transition={{ 
                    y: {
                      delay: index * 0.2, 
                      duration: 6 + index, 
                      repeat: Infinity, 
                      repeatType: 'mirror',
                      ease: "easeInOut"
                    },
                    opacity: { duration: 0.5, delay: index * 0.1 },
                    scale: { duration: 0.5, delay: index * 0.1 }
                  }}
                  className="absolute card w-56 overflow-hidden shadow-2xl border-white/5 cursor-pointer backdrop-blur-md pointer-events-auto"
                  style={{ left: pos.left, top: pos.top }}
                >
                  <div className="h-32 w-full bg-surface-muted relative overflow-hidden">
                    <img 
                      src={recipe.image} 
                      alt={recipe.title} 
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  </div>
                  <div className="p-4 bg-surface-card/80">
                    <p className="text-white font-semibold text-sm truncate">{recipe.title}</p>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-gray-400 uppercase tracking-wider">
                      <span className="bg-white/5 px-2 py-0.5 rounded-md">{recipe.tag}</span>
                      <span>{recipe.time}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="pb-24">
          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map(({ title, description, icon: Icon }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, borderColor: 'rgba(255, 111, 60, 0.3)' }}
                transition={{ delay: index * 0.1 }}
                className="card p-6 group transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-brand/20 transition-all duration-300">
                  <Icon className="w-6 h-6 text-brand" />
                </div>
                <h3 className="text-white text-lg font-semibold group-hover:text-brand transition-colors">{title}</h3>
                <p className="text-gray-400 mt-2 leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <footer className="max-w-6xl mx-auto px-6 pb-16 pt-10 relative z-20 border-t border-white/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-3">
            <span className="opacity-60 font-medium italic">"By Foodie For Foodies"</span>
          </div>
          
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 bg-white/5 px-5 py-2.5 rounded-2xl border border-white/5"
          >
            <span className="text-gray-400">Crafted with</span>
            <motion.span 
              animate={{ scale: [1, 1.2, 1] }} 
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-red-500"
            >
              ❤️
            </motion.span>
            <span className="text-white font-display font-bold tracking-wide">Yash Mishra</span>
          </motion.div>

          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
