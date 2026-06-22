const Trip = require('../models/Trip');
const { isMongooseEnabled } = require('../config/db');
const jsonDb = require('../utils/jsonDb');
const geminiService = require('../services/geminiService');

// Create a new trip
exports.createTrip = async (req, res) => {
  const { destination, numberOfDays, budgetType, interests } = req.body;
  const userId = req.user.id;

  if (!destination || !numberOfDays || !budgetType) {
    return res.status(400).json({ message: 'Destination, number of days, and budget type are required' });
  }

  try {
    // Generate itinerary and budget estimation using LLM
    const generatedData = await geminiService.generateTripItinerary(
      destination,
      numberOfDays,
      budgetType,
      interests || []
    );

    const tripPayload = {
      userId,
      destination,
      numberOfDays: parseInt(numberOfDays),
      budgetType,
      interests: interests || [],
      itinerary: generatedData.itinerary || [],
      estimatedBudget: generatedData.estimatedBudget || { flights: 0, accommodation: 0, food: 0, activities: 0, total: 0 },
      hotels: generatedData.hotels || [],
      expenses: []
    };

    let newTrip;
    if (isMongooseEnabled()) {
      const trip = new Trip(tripPayload);
      newTrip = await trip.save();
    } else {
      newTrip = jsonDb.create('trips', tripPayload);
    }

    res.status(201).json(newTrip);
  } catch (err) {
    console.error('Error creating trip:', err);
    res.status(500).json({ message: 'Server error during trip planning' });
  }
};

// Get all trips for the logged-in user
exports.getTrips = async (req, res) => {
  const userId = req.user.id;

  try {
    let trips;
    if (isMongooseEnabled()) {
      trips = await Trip.find({ userId }).sort({ createdAt: -1 });
    } else {
      trips = jsonDb.find('trips', { userId }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    res.json(trips);
  } catch (err) {
    console.error('Error fetching trips:', err);
    res.status(500).json({ message: 'Server error fetching trips' });
  }
};

// Get a single trip (with ownership authorization check)
exports.getTrip = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    let trip;
    if (isMongooseEnabled()) {
      trip = await Trip.findById(id);
    } else {
      trip = jsonDb.findById('trips', id);
    }

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Verify ownership
    const tripUserId = trip.userId.toString();
    if (tripUserId !== userId) {
      return res.status(403).json({ message: 'Access denied: You do not own this trip' });
    }

    res.json(trip);
  } catch (err) {
    console.error('Error fetching trip:', err);
    res.status(500).json({ message: 'Server error fetching trip' });
  }
};

// Update a trip manual fields/itinerary
exports.updateTrip = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const updates = req.body;

  try {
    let trip;
    if (isMongooseEnabled()) {
      trip = await Trip.findById(id);
    } else {
      trip = jsonDb.findById('trips', id);
    }

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Verify ownership
    if (trip.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied: You do not own this trip' });
    }

    let updatedTrip;
    if (isMongooseEnabled()) {
      updatedTrip = await Trip.findByIdAndUpdate(id, updates, { new: true });
    } else {
      updatedTrip = jsonDb.findByIdAndUpdate('trips', id, updates);
    }

    res.json(updatedTrip);
  } catch (err) {
    console.error('Error updating trip:', err);
    res.status(500).json({ message: 'Server error updating trip' });
  }
};

// Delete a trip
exports.deleteTrip = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    let trip;
    if (isMongooseEnabled()) {
      trip = await Trip.findById(id);
    } else {
      trip = jsonDb.findById('trips', id);
    }

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Verify ownership
    if (trip.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied: You do not own this trip' });
    }

    if (isMongooseEnabled()) {
      await Trip.findByIdAndDelete(id);
    } else {
      jsonDb.findByIdAndDelete('trips', id);
    }

    res.json({ message: 'Trip deleted successfully' });
  } catch (err) {
    console.error('Error deleting trip:', err);
    res.status(500).json({ message: 'Server error deleting trip' });
  }
};

// Regenerate a specific day's itinerary via LLM
exports.regenerateDay = async (req, res) => {
  const { id } = req.params;
  const { dayNumber, prompt } = req.body;
  const userId = req.user.id;

  if (!dayNumber || !prompt) {
    return res.status(400).json({ message: 'Day number and prompt are required' });
  }

  try {
    let trip;
    if (isMongooseEnabled()) {
      trip = await Trip.findById(id);
    } else {
      trip = jsonDb.findById('trips', id);
    }

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Verify ownership
    if (trip.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied: You do not own this trip' });
    }

    const dayIdx = trip.itinerary.findIndex(d => d.dayNumber === parseInt(dayNumber));
    if (dayIdx === -1) {
      return res.status(400).json({ message: `Day ${dayNumber} does not exist in itinerary` });
    }

    const currentDayActivities = trip.itinerary[dayIdx].activities;

    // Call LLM day-level regenerator
    const regeneratedActivities = await geminiService.regenerateSingleDay(
      trip.destination,
      trip.budgetType,
      dayNumber,
      currentDayActivities,
      prompt
    );

    // Update activities for this day
    trip.itinerary[dayIdx].activities = regeneratedActivities;

    // Recalculate estimated budget activities cost
    let newActivitiesCost = 0;
    trip.itinerary.forEach(d => {
      d.activities.forEach(act => {
        newActivitiesCost += Number(act.cost || 0);
      });
    });

    const updatedBudget = {
      ...trip.estimatedBudget,
      activities: newActivitiesCost,
      total: (trip.estimatedBudget.flights || 0) + (trip.estimatedBudget.accommodation || 0) + (trip.estimatedBudget.food || 0) + newActivitiesCost
    };

    let updatedTrip;
    if (isMongooseEnabled()) {
      trip.estimatedBudget = updatedBudget;
      trip.markModified('itinerary');
      trip.markModified('estimatedBudget');
      updatedTrip = await trip.save();
    } else {
      updatedTrip = jsonDb.findByIdAndUpdate('trips', id, {
        itinerary: trip.itinerary,
        estimatedBudget: updatedBudget
      });
    }

    res.json(updatedTrip);
  } catch (err) {
    console.error('Error regenerating day:', err);
    res.status(500).json({ message: 'Server error regenerating day' });
  }
};

// Add actual expense
exports.addExpense = async (req, res) => {
  const { id } = req.params;
  const { title, category, amount, date } = req.body;
  const userId = req.user.id;

  if (!title || !category || !amount || !date) {
    return res.status(400).json({ message: 'Please enter all expense details' });
  }

  try {
    let trip;
    if (isMongooseEnabled()) {
      trip = await Trip.findById(id);
    } else {
      trip = jsonDb.findById('trips', id);
    }

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Verify ownership
    if (trip.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied: You do not own this trip' });
    }

    const newExpense = {
      id: Math.random().toString(36).substring(2, 11),
      title,
      category,
      amount: parseFloat(amount),
      date
    };

    let updatedTrip;
    if (isMongooseEnabled()) {
      updatedTrip = await Trip.findByIdAndUpdate(
        id,
        { $push: { expenses: newExpense } },
        { new: true }
      );
    } else {
      updatedTrip = jsonDb.findByIdAndUpdate('trips', id, {
        $push: { expenses: newExpense }
      });
    }

    res.json(updatedTrip);
  } catch (err) {
    console.error('Error adding expense:', err);
    res.status(500).json({ message: 'Server error adding expense' });
  }
};

// Delete actual expense
exports.deleteExpense = async (req, res) => {
  const { id, expenseId } = req.params;
  const userId = req.user.id;

  try {
    let trip;
    if (isMongooseEnabled()) {
      trip = await Trip.findById(id);
    } else {
      trip = jsonDb.findById('trips', id);
    }

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Verify ownership
    if (trip.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied: You do not own this trip' });
    }

    let updatedTrip;
    if (isMongooseEnabled()) {
      updatedTrip = await Trip.findByIdAndUpdate(
        id,
        { $pull: { expenses: { id: expenseId } } },
        { new: true }
      );
    } else {
      updatedTrip = jsonDb.findByIdAndUpdate('trips', id, {
        $pull: { expenses: { id: expenseId } }
      });
    }

    res.json(updatedTrip);
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ message: 'Server error deleting expense' });
  }
};
