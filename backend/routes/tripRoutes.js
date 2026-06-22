const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const auth = require('../middleware/auth');

router.post('/', auth, tripController.createTrip);
router.get('/', auth, tripController.getTrips);
router.get('/:id', auth, tripController.getTrip);
router.put('/:id', auth, tripController.updateTrip);
router.delete('/:id', auth, tripController.deleteTrip);
router.post('/:id/regenerate-day', auth, tripController.regenerateDay);
router.post('/:id/expenses', auth, tripController.addExpense);
router.delete('/:id/expenses/:expenseId', auth, tripController.deleteExpense);

module.exports = router;
