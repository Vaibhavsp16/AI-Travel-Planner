'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Plus, MapPin, Calendar, Wallet, Trash2, ArrowRight, Plane, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchTrips = async () => {
      try {
        const res = await axios.get(`${API_URL}/trips`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTrips(res.data);
      } catch (err) {
        console.error('Error fetching trips:', err);
        if (err.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('auth-change'));
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [router, API_URL]);

  const handleDelete = async (id, e) => {
    e.preventDefault(); // prevent clicking link card
    if (!confirm('Are you sure you want to delete this trip itinerary?')) return;
    
    setDeletingId(id);
    const token = localStorage.getItem('token');

    try {
      await axios.delete(`${API_URL}/trips/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrips(trips.filter(t => t._id !== id));
    } catch (err) {
      console.error('Error deleting trip:', err);
      alert('Failed to delete trip. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        <p className="text-slate-500 text-sm">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">My Travel Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and view your generated itineraries.</p>
        </div>
        <Link href="/trips/create" className="btn-primary flex items-center gap-2 self-start md:self-auto">
          <Plus className="w-4 h-4" />
          Plan New Trip
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="bg-white border border-brand-100 rounded-2xl p-12 text-center flex flex-col items-center gap-4 max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-500">
            <Plane className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No trips planned yet</h3>
          <p className="text-slate-600 text-sm max-w-xs">
            Start by planning your first AI-generated custom travel itinerary. Provide your destination, interests, and budget.
          </p>
          <Link href="/trips/create" className="btn-primary flex items-center gap-2 mt-2">
            <Plus className="w-4 h-4" />
            Create First Trip
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {trips.map((trip) => (
            <Link 
              key={trip._id} 
              href={`/trips/${trip._id}`}
              className="card-minimalist hover:border-brand-300 group block relative hover:shadow-md"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-lg text-slate-800 group-hover:text-brand-700 transition-colors">
                      {trip.destination}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(trip._id, e)}
                    disabled={deletingId === trip._id}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete trip"
                  >
                    {deletingId === trip._id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2 border-y border-brand-50 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4 text-brand-400" />
                    <span>{trip.numberOfDays} Days</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Wallet className="w-4 h-4 text-brand-400" />
                    <span className="capitalize">{trip.budgetType} Budget</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-brand-600 font-semibold">
                  <span>
                    Estimated: ${trip.estimatedBudget?.total || 0}
                  </span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    View Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
