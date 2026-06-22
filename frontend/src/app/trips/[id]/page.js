'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import {
  MapPin, Calendar, Wallet, Sparkles, Loader2, ArrowLeft, Trash2, Plus, 
  ChevronRight, Hotel, DollarSign, PlusCircle, RefreshCw, BarChart2, Tag, CalendarDays
} from 'lucide-react';
import Link from 'next/link';

export default function TripDetails() {
  const router = useRouter();
  const { id } = useParams();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(1);

  // New activity form state
  const [newActivity, setNewActivity] = useState({
    time: '10:00 AM',
    activityName: '',
    description: '',
    cost: ''
  });
  const [showAddActivityForm, setShowAddActivityForm] = useState(false);

  // Day regeneration prompt state
  const [regenPrompt, setRegenPrompt] = useState('');
  const [regenLoading, setRegenLoading] = useState(false);

  // New expense form state
  const [newExpense, setNewExpense] = useState({
    title: '',
    category: 'activities', // default
    amount: '',
    date: ''
  });
  const [showAddExpenseForm, setShowAddExpenseForm] = useState(false);
  const [expenseLoading, setExpenseLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // Helper to sort activities by time chronologically
  const getSortedActivities = (activities = []) => {
    const parseTimeToMinutes = (timeStr) => {
      if (!timeStr) return 9999;
      // Strip any emojis or leading/trailing spaces
      const clean = timeStr.trim().toUpperCase();
      const match = clean.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return 9999;
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const ampm = match[3];
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };
    return [...activities].sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchTrip = async () => {
      try {
        const res = await axios.get(`${API_URL}/trips/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTrip(res.data);
        if (res.data.expenses && res.data.expenses.length > 0) {
          // Pre-populate date for expense input
          setNewExpense(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }));
        } else {
          setNewExpense(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }));
        }
      } catch (err) {
        console.error('Error fetching trip:', err);
        if (err.response?.status === 403) {
          alert('Access denied: You do not own this trip.');
          router.push('/dashboard');
        } else if (err.response?.status === 401) {
          router.push('/login');
        } else {
          alert('Trip not found.');
          router.push('/dashboard');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [id, router, API_URL]);

  // Remove activity handler
  const handleRemoveActivity = async (dayNumber, activityId) => {
    if (!confirm('Are you sure you want to remove this activity?')) return;
    const token = localStorage.getItem('token');

    // Filter local copy
    const updatedItinerary = trip.itinerary.map(day => {
      if (day.dayNumber === dayNumber) {
        return {
          ...day,
          activities: day.activities.filter(act => act.id !== activityId)
        };
      }
      return day;
    });

    // Recalculate estimated budget
    let newActivitiesCost = 0;
    updatedItinerary.forEach(d => {
      d.activities.forEach(act => {
        newActivitiesCost += Number(act.cost || 0);
      });
    });

    const updatedBudget = {
      ...trip.estimatedBudget,
      activities: newActivitiesCost,
      total: (trip.estimatedBudget.flights || 0) + (trip.estimatedBudget.accommodation || 0) + (trip.estimatedBudget.food || 0) + newActivitiesCost
    };

    try {
      const res = await axios.put(`${API_URL}/trips/${id}`, {
        itinerary: updatedItinerary,
        estimatedBudget: updatedBudget
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrip(res.data);
    } catch (err) {
      console.error('Error updating activities:', err);
      alert('Failed to update activities.');
    }
  };

  // Add activity handler
  const handleAddActivity = async (e) => {
    e.preventDefault();
    if (!newActivity.activityName) return;

    const token = localStorage.getItem('token');
    const activityPayload = {
      id: 'act_' + Date.now().toString(36),
      time: newActivity.time || 'Flexible',
      activityName: newActivity.activityName,
      description: newActivity.description,
      cost: parseFloat(newActivity.cost) || 0
    };

    const updatedItinerary = trip.itinerary.map(day => {
      if (day.dayNumber === activeDay) {
        return {
          ...day,
          activities: [...day.activities, activityPayload]
        };
      }
      return day;
    });

    // Recalculate estimated budget
    let newActivitiesCost = 0;
    updatedItinerary.forEach(d => {
      d.activities.forEach(act => {
        newActivitiesCost += Number(act.cost || 0);
      });
    });

    const updatedBudget = {
      ...trip.estimatedBudget,
      activities: newActivitiesCost,
      total: (trip.estimatedBudget.flights || 0) + (trip.estimatedBudget.accommodation || 0) + (trip.estimatedBudget.food || 0) + newActivitiesCost
    };

    try {
      const res = await axios.put(`${API_URL}/trips/${id}`, {
        itinerary: updatedItinerary,
        estimatedBudget: updatedBudget
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrip(res.data);
      setNewActivity({ time: '10:00 AM', activityName: '', description: '', cost: '' });
      setShowAddActivityForm(false);
    } catch (err) {
      console.error('Error adding activity:', err);
      alert('Failed to add activity.');
    }
  };

  // Regenerate Specific Day Handler
  const handleRegenerateDay = async (e) => {
    e.preventDefault();
    if (!regenPrompt) return;

    const token = localStorage.getItem('token');
    setRegenLoading(true);

    try {
      const res = await axios.post(`${API_URL}/trips/${id}/regenerate-day`, {
        dayNumber: activeDay,
        prompt: regenPrompt
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrip(res.data);
      setRegenPrompt('');
    } catch (err) {
      console.error('Error regenerating day:', err);
      alert('Failed to regenerate day. Please try again.');
    } finally {
      setRegenLoading(false);
    }
  };

  // Add actual expense handler
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount || !newExpense.date) return;

    const token = localStorage.getItem('token');
    setExpenseLoading(true);

    try {
      const res = await axios.post(`${API_URL}/trips/${id}/expenses`, {
        title: newExpense.title,
        category: newExpense.category,
        amount: parseFloat(newExpense.amount),
        date: newExpense.date
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrip(res.data);
      setNewExpense({
        title: '',
        category: 'activities',
        amount: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddExpenseForm(false);
    } catch (err) {
      console.error('Error adding expense:', err);
      alert('Failed to log expense.');
    } finally {
      setExpenseLoading(false);
    }
  };

  // Delete actual expense handler
  const handleDeleteExpense = async (expenseId) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    const token = localStorage.getItem('token');

    try {
      const res = await axios.delete(`${API_URL}/trips/${id}/expenses/${expenseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrip(res.data);
    } catch (err) {
      console.error('Error deleting expense:', err);
      alert('Failed to delete expense.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        <p className="text-slate-500 text-sm">Reviewing your travel plan...</p>
      </div>
    );
  }

  if (!trip) return null;

  // Custom Feature - Actual Expense Calculations
  const totalEstimated = trip.estimatedBudget?.total || 0;
  const actualExpensesList = trip.expenses || [];
  const totalActual = actualExpensesList.reduce((acc, exp) => acc + (exp.amount || 0), 0);
  
  // Calculate percentage of budget used
  const budgetPercentage = totalEstimated > 0 ? (totalActual / totalEstimated) * 100 : 0;
  const isOverBudget = totalActual > totalEstimated;

  // Category breakdown for chart
  const categories = ['flights', 'accommodation', 'food', 'activities', 'other'];
  const getCategoryTotal = (cat) => {
    return actualExpensesList
      .filter(exp => exp.category === cat)
      .reduce((acc, exp) => acc + exp.amount, 0);
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 font-semibold transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-100 pb-6">
          <div>
            <div className="flex items-center gap-2 text-brand-700">
              <MapPin className="w-5 h-5" />
              <h1 className="text-3xl font-extrabold text-slate-800">{trip.destination}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-brand-400" />
                {trip.numberOfDays} Days
              </span>
              <span className="px-2 py-0.5 rounded bg-brand-100 border border-brand-200 text-brand-700 text-xs font-semibold uppercase">
                {trip.budgetType} Budget
              </span>
              {trip.interests?.map((interest, idx) => (
                <span key={idx} className="flex items-center gap-0.5 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                  <Tag className="w-3 h-3 text-slate-400" />
                  {interest}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 block uppercase font-bold">Estimated Cost</span>
            <span className="text-2xl font-black text-brand-600">${totalEstimated}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Itinerary & Expense Tracker */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Itinerary Day selection & Details (Col Span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Day Selector Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 border-b border-brand-100">
            {trip.itinerary?.map((day) => (
              <button
                key={day.dayNumber}
                onClick={() => {
                  setActiveDay(day.dayNumber);
                  setShowAddActivityForm(false);
                }}
                className={`px-4 py-2 text-sm font-bold rounded-lg border transition-all shrink-0 ${
                  activeDay === day.dayNumber
                    ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                    : 'bg-white border-brand-200 text-slate-700 hover:bg-brand-50'
                }`}
              >
                Day {day.dayNumber}
              </button>
            ))}
          </div>

          {/* Activities Container */}
          <div className="card-minimalist">
            <div className="flex items-center justify-between border-b border-brand-50 pb-4 mb-4">
              <h2 className="font-bold text-lg text-slate-800 flex items-center gap-1.5">
                <CalendarDays className="w-5 h-5 text-brand-500" />
                Schedule for Day {activeDay}
              </h2>
              <button
                onClick={() => setShowAddActivityForm(!showAddActivityForm)}
                className="btn-outline py-1 px-3 flex items-center gap-1 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                {showAddActivityForm ? 'Cancel' : 'Add Activity'}
              </button>
            </div>

            {/* Add Activity Form */}
            {showAddActivityForm && (
              <form onSubmit={handleAddActivity} className="bg-brand-50 p-4 border border-brand-100 rounded-lg flex flex-col gap-3 mb-4">
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Time</label>
                    <select
                      className="w-full px-3 py-1.5 bg-white border border-brand-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-brand-400 focus:outline-none transition-all"
                      value={newActivity.time}
                      onChange={(e) => setNewActivity({ ...newActivity, time: e.target.value })}
                    >
                      <option value="08:00 AM">08:00 AM</option>
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="12:00 PM">12:00 PM</option>
                      <option value="01:00 PM">01:00 PM</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="03:00 PM">03:00 PM</option>
                      <option value="04:00 PM">04:00 PM</option>
                      <option value="05:00 PM">05:00 PM</option>
                      <option value="06:00 PM">06:00 PM</option>
                      <option value="07:00 PM">07:00 PM</option>
                      <option value="08:00 PM">08:00 PM</option>
                      <option value="09:00 PM">09:00 PM</option>
                      <option value="10:00 PM">10:00 PM</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Activity Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Visit Museum"
                      className="input-minimalist text-xs py-1.5 px-3"
                      value={newActivity.activityName}
                      onChange={(e) => setNewActivity({ ...newActivity, activityName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Description (Optional)</label>
                    <input
                      type="text"
                      placeholder="Brief details about the activity"
                      className="input-minimalist text-xs py-1.5 px-3"
                      value={newActivity.description}
                      onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Cost (USD)</label>
                    <input
                      type="number"
                      placeholder="0"
                      className="input-minimalist text-xs py-1.5 px-3"
                      value={newActivity.cost}
                      onChange={(e) => setNewActivity({ ...newActivity, cost: e.target.value })}
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary py-1.5 text-xs mt-1 self-end px-4">
                  Add to Itinerary
                </button>
              </form>
            )}

            {/* Activities List */}
            {trip.itinerary?.find(d => d.dayNumber === activeDay)?.activities?.length === 0 ? (
              <p className="text-slate-500 text-sm py-6 text-center">No activities listed. Add one above or regenerate the day!</p>
            ) : (
              <div className="flex flex-col gap-4">
                {getSortedActivities(trip.itinerary?.find(d => d.dayNumber === activeDay)?.activities || []).map((act) => (
                  <div key={act.id} className="group p-4 bg-slate-50 border border-slate-100 rounded-lg hover:border-brand-200 transition-colors flex items-start gap-4 justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-semibold text-brand-600 bg-white border border-brand-100 px-2 py-0.5 rounded shadow-sm shrink-0">
                        {act.time}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm md:text-base">{act.activityName}</h4>
                        {act.description && <p className="text-slate-600 text-xs md:text-sm mt-0.5 leading-relaxed">{act.description}</p>}
                        {act.cost > 0 && (
                          <span className="inline-block text-xs text-brand-700 bg-brand-50 px-2 py-0.5 rounded font-medium mt-1.5">
                            Cost: ${act.cost}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveActivity(activeDay, act.id)}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors self-start"
                      title="Remove activity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Day Regeneration Form */}
            <div className="border-t border-brand-100 mt-6 pt-6 flex flex-col gap-3">
              <div>
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-brand-500 animate-pulse" />
                  Regenerate Day {activeDay} with AI
                </h4>
                <p className="text-slate-500 text-xs mt-0.5">Instruct the travel agent to redesign this day's activities.</p>
              </div>
              <form onSubmit={handleRegenerateDay} className="flex gap-2">
                <input
                  type="text"
                  required
                  disabled={regenLoading}
                  placeholder='e.g., "Add more outdoor hikes", "Focus on cheap street food", "Make it a relaxed museum day"'
                  className="input-minimalist text-xs py-2 px-3 flex-1"
                  value={regenPrompt}
                  onChange={(e) => setRegenPrompt(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={regenLoading || !regenPrompt}
                  className="btn-primary py-2 text-xs font-semibold flex items-center gap-1 shrink-0"
                >
                  {regenLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Redrafting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      Regenerate
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Hotel Recommendations */}
          <div className="card-minimalist">
            <h2 className="font-bold text-lg text-slate-800 flex items-center gap-1.5 border-b border-brand-50 pb-4 mb-4">
              <Hotel className="w-5 h-5 text-brand-500" />
              Recommended Lodgings
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {trip.hotels?.map((hotel, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex flex-col justify-between hover:border-brand-200 transition-colors">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-brand-600 block">{hotel.priceLevel}</span>
                    <h4 className="font-bold text-slate-800 text-sm mt-1">{hotel.name}</h4>
                    <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">{hotel.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-xs">
                    <span className="font-semibold text-brand-700">★ {hotel.rating} / 5</span>
                    <span className="text-slate-400">Rating</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Custom Expense Tracker (Col Span 1) */}
        <div className="flex flex-col gap-6">
          
          {/* AI estimated budget summary */}
          <div className="card-minimalist">
            <h2 className="font-bold text-lg text-slate-800 flex items-center gap-1.5 border-b border-brand-50 pb-4 mb-4">
              <DollarSign className="w-5 h-5 text-brand-500" />
              AI Estimated Budget
            </h2>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>✈️ Flights</span>
                <span className="font-semibold">${trip.estimatedBudget?.flights || 0}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>🏨 Lodging</span>
                <span className="font-semibold">${trip.estimatedBudget?.accommodation || 0}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>🍽️ Food</span>
                <span className="font-semibold">${trip.estimatedBudget?.food || 0}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>🎟️ Activities</span>
                <span className="font-semibold">${trip.estimatedBudget?.activities || 0}</span>
              </div>
              <div className="border-t border-brand-100 pt-3 flex justify-between text-slate-800 font-bold text-base">
                <span>Total Drafted</span>
                <span className="text-brand-600">${totalEstimated}</span>
              </div>
            </div>
          </div>

          {/* Interactive Expenses Tracker */}
          <div className="card-minimalist border-brand-200 shadow-md">
            <div className="flex items-center justify-between border-b border-brand-50 pb-4 mb-4">
              <h2 className="font-bold text-lg text-slate-800 flex items-center gap-1.5">
                <BarChart2 className="w-5 h-5 text-brand-500" />
                Expense Tracker
              </h2>
              <button
                onClick={() => setShowAddExpenseForm(!showAddExpenseForm)}
                className="btn-primary py-1 px-2.5 flex items-center gap-1 text-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                {showAddExpenseForm ? 'Close' : 'Log Spend'}
              </button>
            </div>

            {/* Live Progress Bar Comparison */}
            <div className="bg-brand-50 p-4 border border-brand-100 rounded-lg flex flex-col gap-3 mb-6">
              <div className="flex justify-between items-end text-xs">
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[9px]">Actual Spent</span>
                  <span className={`text-lg font-black ${isOverBudget ? 'text-orange-600' : 'text-emerald-600'}`}>
                    ${totalActual}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block uppercase font-bold text-[9px]">Limit</span>
                  <span className="text-slate-700 font-semibold">${totalEstimated}</span>
                </div>
              </div>

              {/* Slider meter */}
              <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOverBudget ? 'bg-orange-500' : budgetPercentage > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} 
                  style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                ></div>
              </div>

              <div className="text-[10px] font-semibold text-slate-500 flex justify-between">
                <span>{budgetPercentage.toFixed(1)}% Used</span>
                <span>
                  {isOverBudget 
                    ? `Over budget by $${totalActual - totalEstimated}!` 
                    : `$${totalEstimated - totalActual} Remaining`
                  }
                </span>
              </div>
            </div>

            {/* Add Expense Form */}
            {showAddExpenseForm && (
              <form onSubmit={handleAddExpense} className="bg-slate-50 p-4 border border-slate-100 rounded-lg flex flex-col gap-3 mb-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Expense Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dinner in Shibuya"
                    className="input-minimalist text-xs py-1.5 px-3"
                    value={newExpense.title}
                    onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Category</label>
                    <select
                      className="input-minimalist text-xs py-1.5 px-3 bg-white"
                      value={newExpense.category}
                      onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    >
                      <option value="flights">✈️ Flights</option>
                      <option value="accommodation">🏨 Lodging</option>
                      <option value="food">🍽️ Food</option>
                      <option value="activities">🎟️ Activities</option>
                      <option value="other">📦 Other</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Amount (USD)</label>
                    <input
                      type="number"
                      required
                      placeholder="0.00"
                      className="input-minimalist text-xs py-1.5 px-3"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Date</label>
                  <input
                    type="date"
                    required
                    className="input-minimalist text-xs py-1.5 px-3"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={expenseLoading}
                  className="btn-primary py-2 text-xs flex items-center justify-center gap-1 mt-1"
                >
                  {expenseLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    'Log Expense'
                  )}
                </button>
              </form>
            )}

            {/* Spent list */}
            <div>
              <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider mb-3">Logged Receipts</h3>
              {actualExpensesList.length === 0 ? (
                <p className="text-slate-400 text-xs italic py-4 text-center">No receipts logged yet. Click Log Spend above.</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                  {actualExpensesList.map((exp) => (
                    <div key={exp.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-xs hover:border-brand-200 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-base">
                          {exp.category === 'flights' ? '✈️' : exp.category === 'accommodation' ? '🏨' : exp.category === 'food' ? '🍽️' : exp.category === 'activities' ? '🎟️' : '📦'}
                        </span>
                        <div>
                          <span className="font-bold text-slate-800 block leading-tight">{exp.title}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{exp.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-700">${exp.amount}</span>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
