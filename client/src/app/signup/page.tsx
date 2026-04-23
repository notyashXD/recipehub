'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import { ChefHat, Mail, Lock, User } from 'lucide-react';
import { isValidEmail, normalizeEmail } from '@/lib/validation';
import ThemeToggle from '@/components/shared/ThemeToggle';

export default function SignupPage() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = form.username.trim();
    const email = normalizeEmail(form.email);
    if (username.length < 3) return toast.error('Username must be at least 3 characters');
    if (!isValidEmail(email)) return toast.error('Please enter a valid email address');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(username, email, form.password);
      toast.success('Welcome to RecipeHub! 🎉');
      router.push('/cook');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative">
      <ThemeToggle className="absolute right-4 top-4" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand/20 border border-brand/30 mb-4">
            <ChefHat className="w-8 h-8 text-brand" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">RecipeHub</h1>
          <p className="text-gray-400 mt-1">Your personal AI cooking companion</p>
        </div>
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Create account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { id: 'signup-username', label: 'Username', key: 'username', type: 'text', icon: User, placeholder: 'chefmaster' },
              { id: 'signup-email', label: 'Email', key: 'email', type: 'email', icon: Mail, placeholder: 'you@example.com' },
              { id: 'signup-password', label: 'Password', key: 'password', type: 'password', icon: Lock, placeholder: '••••••••' },
            ].map(({ id, label, key, type, icon: Icon, placeholder }) => (
              <div key={key}>
                <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input id={id} type={type} value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: key === 'email' ? e.target.value.toLowerCase() : e.target.value })}
                    onBlur={() => key === 'email' && setForm({ ...form, email: normalizeEmail(form.email) })}
                    className="input pl-10" placeholder={placeholder} required
                    pattern={key === 'email' ? '[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}' : undefined}
                    title={key === 'email' ? 'Enter a valid email address' : undefined} />
                </div>
              </div>
            ))}
            <button id="signup-submit" type="submit" disabled={loading} className="btn-primary w-full mt-2 disabled:opacity-50">
              {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating...</span> : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-gray-400 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-brand hover:text-brand-light font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
