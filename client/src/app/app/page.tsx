'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function ClassicEntryPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    router.replace(user ? '/cook' : '/login');
  }, [user, router]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
