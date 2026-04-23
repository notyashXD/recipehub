'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import { ChefHat, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { isValidEmail, normalizeEmail } from '@/lib/validation';
import ThemeToggle from '@/components/shared/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedEmail = normalizeEmail(email);
    if (!isValidEmail(cleanedEmail)) return toast.error('Please enter a valid email address');
    setLoading(true);
    try {
      await login(cleanedEmail, password);
      toast.success('Welcome back! 👋');
      router.push('/cook');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleDemo = async () => {
    setLoading(true);
    try {
      await login('demo@recipebox.com', 'demo1234');
      toast.success('Logged in as RecipeHub! 🍳');
      router.push('/cook');
    } catch { toast.error('Demo login failed'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative">
      <ThemeToggle className="absolute right-4 top-4" />
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand/20 border border-brand/30 mb-4">
            <ChefHat className="w-8 h-8 text-brand" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">RecipeHub</h1>
          <p className="text-gray-400 mt-1">What can you cook today?</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Sign in</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmail(normalizeEmail(email))}
                  pattern="[^\s@]+@[^\s@]+\.[^\s@]{2,}"
                  title="Enter a valid email address"
                  className="input pl-10" placeholder="you@example.com" required />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input id="login-password" type={showPw ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} className="input pl-10 pr-10" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button id="login-submit" type="submit" disabled={loading} className="btn-primary w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Signing in...</span> : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-surface-border" />
            <span className="text-xs text-gray-500">or</span>
            <div className="flex-1 h-px bg-surface-border" />
          </div>

          <button id="demo-login" onClick={handleDemo} disabled={loading}
            className="btn-ghost w-full flex items-center justify-center gap-2">
            <span>🍳</span> Try Demo Account
          </button>

          <p className="text-center text-gray-400 text-sm mt-6">
            No account?{' '}
            <Link href="/signup" className="text-brand hover:text-brand-light font-medium">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
