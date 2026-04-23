'use client';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import clsx from 'clsx';

type Theme = 'dark' | 'light';
const THEME_STORAGE_KEY = 'rb_theme';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('theme-dark', 'theme-light');
  root.classList.add(theme === 'light' ? 'theme-light' : 'theme-dark');
  root.style.colorScheme = theme;
}

export default function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
    setTheme(stored);
    applyTheme(stored);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className={clsx(
        'btn-ghost inline-flex items-center gap-2 py-2 px-3 text-xs rounded-full',
        className
      )}
      aria-label="Toggle color mode"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
      <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
    </button>
  );
}
