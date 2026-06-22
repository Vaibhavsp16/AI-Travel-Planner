const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  id: { type: String, required: true },
  time: { type: String, default: '' },
  activityName: { type: String, required: true },
  description: { type: String, default: '' },
  cost: { type: Number, default: 0 }
});

const DaySchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true },
  activities: [ActivitySchema]
});

const EstimatedBudgetSchema = new mongoose.Schema({
  flights: { type: Number, default: 0 },
  accommodation: { type: Number, default: 0 },
  food: { type: Number, default: 0 },
  activities: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
});

const HotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  priceLevel: { type: String, default: '' },
  rating: { type: String, default: '' },
  description: { type: String, default: '' }
});

const ExpenseSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  category: { type: String, required: true }, // e.g., 'flights', 'accommodation', 'food', 'activities', 'other'
  amount: { type: Number, required: true },
  date: { type: String, required: true }
});

const TripSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  destination: {
    type: String,
    required: true,
    trim: true
  },
  numberOfDays: {
    type: Number,
    required: true
  },
  budgetType: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  interests: {
    type: [String],
    default: []
  },
  itinerary: [DaySchema],
  estimatedBudget: EstimatedBudgetSchema,
  hotels: [HotelSchema],
  expenses: [ExpenseSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Trip', TripSchema);
