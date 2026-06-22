'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Compass, Calendar, Wallet, Hotel, CheckSquare, Sparkles } from 'lucide-react';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
    const handleAuth = () => setIsLoggedIn(!!localStorage.getItem('token'));
    window.addEventListener('auth-change', handleAuth);
    return () => window.removeEventListener('auth-change', handleAuth);
  }, []);

  return (
    <div className="flex flex-col gap-16 py-8">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto flex flex-col items-center gap-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 border border-brand-200 text-brand-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by Gemini LLM
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 leading-tight">
          Your Next Adventure, <br />
          <span className="text-brand-600">Planned in Seconds</span>
        </h1>
        <p className="text-slate-600 text-lg md:text-xl max-w-xl">
          Create structured day-by-day travel itineraries, estimate expenses, get hotel suggestions, and track your actual spending—all in one minimalist dashboard.
        </p>
        <div className="flex gap-4 mt-2">
          {isLoggedIn ? (
            <Link href="/dashboard" className="btn-primary px-8 py-3 text-base">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-secondary px-8 py-3 text-base">
                Login
              </Link>
              <Link href="/register" className="btn-primary px-8 py-3 text-base">
                Start Planning Free
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Feature Grid */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="card-minimalist hover:border-brand-300 transition-colors flex flex-col gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-slate-800">AI Itinerary Generator</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Get structured daily schedules with descriptions, timings, and estimated costs tailored to your chosen destination and interests.
          </p>
        </div>

        <div className="card-minimalist hover:border-brand-300 transition-colors flex flex-col gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600">
            <Wallet className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-slate-800">Budget Estimation</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Receive automated price breakdowns for flights, lodging, meals, and activities based on low, medium, or high budget preferences.
          </p>
        </div>

        <div className="card-minimalist hover:border-brand-300 transition-colors flex flex-col gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600">
            <Hotel className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-slate-800">Lodging & Hotels</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Discover hotel recommendations matching your destination and budget, with ratings and pricing details to make booking decisions easier.
          </p>
        </div>
      </section>

      {/* Custom Feature highlight */}
      <section className="bg-white border border-brand-100 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center justify-between shadow-sm">
        <div className="max-w-xl flex flex-col gap-4">
          <div className="inline-flex w-fit items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <CheckSquare className="w-3.5 h-3.5" />
            Exclusive Feature
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
            Interactive Expense Tracking
          </h2>
          <p className="text-slate-600 text-sm md:text-base leading-relaxed">
            Don't just plan—keep track! Log your real-time expenses under flights, lodging, dining, and activities during your trip. Compare your total real-world expenditures with the AI estimates in a dynamic side-by-side comparison chart.
          </p>
        </div>
        <div className="w-full md:w-80 bg-brand-50 border border-brand-200 rounded-xl p-6 flex flex-col gap-4 shadow-inner">
          <div className="text-xs font-bold text-brand-700 tracking-wider uppercase">Budget Comparison</div>
          <div className="flex flex-col gap-3">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                <span>AI Estimated Budget</span>
                <span>$950</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div className="bg-brand-500 h-full rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                <span>Actual Expenses</span>
                <span>$680 (Under budget)</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '71.5%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
