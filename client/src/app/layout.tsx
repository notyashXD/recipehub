import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'RecipeHub — What Can I Cook?',
  description: 'Smart recipe matching based on ingredients you have. AI-powered cooking companion.',
  manifest: '/manifest.json',
};

const themeInitScript = `
(() => {
  try {
    const stored = localStorage.getItem('rb_theme');
    const theme = stored === 'light' ? 'light' : 'dark';
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-light');
    root.classList.add(theme === 'light' ? 'theme-light' : 'theme-dark');
    root.style.colorScheme = theme;
  } catch {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-surface text-white">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: { 
              background: '#1A1D27', 
              color: '#F9FAFB', 
              border: '1px solid #2A2D3A',
              borderRadius: '16px',
              fontFamily: 'Outfit, sans-serif'
            },
            success: { iconTheme: { primary: '#FF6B35', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
