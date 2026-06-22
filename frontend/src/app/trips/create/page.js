'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { MapPin, Calendar, Wallet, CheckSquare, Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateTrip() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    destination: '',
    numberOfDays: 3,
    budgetType: 'medium',
    interests: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const interestOptions = [
    { id: 'Food', label: '🍜 Food & Gastronomy' },
    { id: 'Culture', label: '🏛️ Culture & Heritage' },
    { id: 'Adventure', label: '🧗 Adventure & Outdoors' },
    { id: 'Shopping', label: '🛍️ Shopping & Malls' },
    { id: 'Nature', label: '🌲 Nature & Parks' }
  ];

  const handleInterestChange = (interestId) => {
    const current = [...formData.interests];
    if (current.includes(interestId)) {
      setFormData({
        ...formData,
        interests: current.filter(item => item !== interestId)
      });
    } else {
      setFormData({
        ...formData,
        interests: [...current, interestId]
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const token = localStorage.getItem('token');

    try {
      const res = await axios.post(`${API_URL}/trips`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      router.push(`/trips/${res.data._id}`);
    } catch (err) {
      console.error('Error creating trip:', err);
      setError(err.response?.data?.message || 'Failed to generate itinerary. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-4">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 font-semibold mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Dashboard
      </Link>

      <div className="card-minimalist">
        <div className="flex items-center gap-2 mb-6 border-b border-brand-100 pb-4">
          <div className="p-2.5 bg-brand-50 rounded-lg text-brand-600">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">Plan a New Adventure</h1>
            <p className="text-slate-500 text-sm mt-0.5">Let our LLM agent draft your custom itinerary.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
            <h3 className="font-bold text-lg text-slate-800">Drafting your Itinerary...</h3>
            <p className="text-slate-600 text-sm max-w-sm">
              Our AI travel agent is analyzing typical costs, hotel availability, and popular activities for <strong className="text-brand-700">{formData.destination}</strong>. This might take up to 10 seconds.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Destination */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase" htmlFor="destination">Where to?</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <MapPin className="w-4.5 h-4.5 text-slate-400" />
                </span>
                <input
                  id="destination"
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-2 bg-white border border-brand-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-brand-400 focus:outline-none transition-all text-sm"
                  placeholder="e.g. Tokyo, Paris, Bali"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                />
              </div>
            </div>

            {/* Days and Budget */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase" htmlFor="numberOfDays">Number of Days</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Calendar className="w-4.5 h-4.5 text-slate-400" />
                  </span>
                  <input
                    id="numberOfDays"
                    type="number"
                    required
                    min="1"
                    max="15"
                    className="w-full pl-10 pr-4 py-2 bg-white border border-brand-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-brand-400 focus:outline-none transition-all text-sm"
                    value={formData.numberOfDays}
                    onChange={(e) => setFormData({ ...formData, numberOfDays: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Budget Tier</label>
                <div className="grid grid-cols-3 gap-2">
                  {['low', 'medium', 'high'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, budgetType: type })}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg capitalize border transition-all ${
                        formData.budgetType === type
                          ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                          : 'bg-white border-brand-200 text-slate-700 hover:bg-brand-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interests */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-600 uppercase">Interests</label>
              <div className="grid sm:grid-cols-2 gap-3 mt-1">
                {interestOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleInterestChange(opt.id)}
                    className={`flex items-center gap-2 p-3 text-sm text-left border rounded-lg transition-all ${
                      formData.interests.includes(opt.id)
                        ? 'bg-brand-50 border-brand-400 text-brand-700 font-semibold'
                        : 'bg-white border-brand-200 text-slate-600 hover:bg-brand-50'
                    }`}
                  >
                    <CheckSquare
                      className={`w-4 h-4 ${
                        formData.interests.includes(opt.id) ? 'text-brand-600 fill-brand-100' : 'text-slate-300'
                      }`}
                    />
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base font-semibold mt-4 shadow"
            >
              <Sparkles className="w-5 h-5" />
              Generate Itinerary
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
