'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { ChefHat, Refrigerator, BookOpen, Sparkles, CalendarDays, Users, User, LogOut, Flame, Home } from 'lucide-react';
import clsx from 'clsx';
import AIChefChat from './AIChefChat';
import ThemeToggle from './ThemeToggle';

const NAV = [
  { href: '/', label: 'Homepage', icon: Home },
  { href: '/cook', label: "What Can I Cook?", icon: Sparkles },
  { href: '/fridge', label: 'My Fridge', icon: Refrigerator },
  { href: '/recipes', label: 'Recipes', icon: BookOpen },
  { href: '/planner', label: 'Meal Planner', icon: CalendarDays },
  { href: '/community', label: 'Community', icon: Users },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-surface-border flex flex-col fixed h-full z-40">
        {/* Logo */}
        <div className="p-6 border-b border-surface-border">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand/20 border border-brand/30 flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-brand" />
              </div>
              <span className="font-display text-xl font-bold text-white">RecipeHub</span>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={clsx('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                pathname === href
                  ? 'bg-brand/15 text-brand border border-brand/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}>
              <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-surface-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-forest flex items-center justify-center text-white font-bold text-sm">
              {user.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.username}</p>
              <div className="flex items-center gap-1 text-xs text-orange-400">
                <Flame className="w-3 h-3" /> {user.streakDays || 0} day streak
              </div>
            </div>
          </div>
          <button id="sidebar-logout" onClick={() => { logout(); router.push('/login'); }}
            className="btn-ghost w-full text-sm flex items-center gap-2 justify-center py-2">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
      <AIChefChat />
    </div>
  );
}
