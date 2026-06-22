'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Compass, User, LogOut, Briefcase } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      if (token && userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (e) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    checkAuth();
    
    // Listen for custom login events
    window.addEventListener('auth-change', checkAuth);
    return () => window.removeEventListener('auth-change', checkAuth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new Event('auth-change'));
    router.push('/');
  };

  if (!mounted) return null;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-brand-200 py-3 px-6 shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-brand-700 hover:text-brand-800 transition-colors">
          <Compass className="w-6 h-6 text-brand-500 animate-spin-slow" />
          <span className="font-bold text-lg tracking-tight">AI Travel Planner</span>
        </Link>

        <nav className="flex items-center gap-6">
          {user ? (
            <>
              <Link 
                href="/dashboard" 
                className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname === '/dashboard' ? 'text-brand-600' : 'text-slate-600 hover:text-brand-600'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                My Trips
              </Link>
              <div className="flex items-center gap-4 pl-4 border-l border-brand-200">
                <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <User className="w-4 h-4 text-brand-500" />
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="btn-secondary py-1.5 px-3 flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100 hover:border-red-200"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="btn-secondary py-1.5 px-4">
                Login
              </Link>
              <Link href="/register" className="btn-primary py-1.5 px-4">
                Sign Up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
