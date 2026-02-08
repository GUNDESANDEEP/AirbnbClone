
const express = require('express');
const Booking = require('../models/Booking');
const Property = require('../models/Property');
const router = express.Router();

// Get bookings for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.params.userId }).populate('property');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel a booking
router.delete('/:bookingId', async (req, res) => {
  const booking = await Booking.findByIdAndDelete(req.params.bookingId);
  if (booking) {
    await Property.findByIdAndUpdate(booking.property, { $pull: { bookings: booking._id } });
    res.json({ message: 'Booking cancelled' });
  } else {
    res.status(404).json({ error: 'Booking not found' });
  }
});
// Check if user is eligible for 20% discount on property booking
router.get('/check-discount', async (req, res) => {
  const { property, user } = req.query;
  if (!property || !user) return res.status(400).json({ error: 'Missing property or user' });
  const previousBooking = await Booking.findOne({ property, user });
  let discountedPrice = null;
  if (previousBooking) {
    // Find property price
    const prop = await require('../models/Property').findById(property);
    if (prop) discountedPrice = Math.round(prop.price * 0.8);
  }
  res.json({ discountedPrice });
});

// Book a property
router.post('/', async (req, res) => {
  const { property, user, startDate, endDate, totalPrice } = req.body;
  // Check for overlapping bookings
  const overlapping = await Booking.findOne({
    property,
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
    ],
  });
  if (overlapping) {
    return res.status(400).json({ error: 'Property is already booked for these dates.' });
  }
  // Check if user has booked this property before
  const previousBooking = await Booking.findOne({ property, user });
  let finalPrice = totalPrice;
  if (previousBooking) {
    finalPrice = Math.round(totalPrice * 0.8); // 20% discount
  }
  const booking = new Booking({ property, user, startDate, endDate, totalPrice: finalPrice });
  await booking.save();
  // Add booking to property
  await Property.findByIdAndUpdate(property, { $push: { bookings: booking._id } });
  res.status(201).json(booking);
});


// Get bookings for a user
router.get('/user/:userId', async (req, res) => {
  const bookings = await Booking.find({ user: req.params.userId }).populate('property');
  res.json(bookings);
});

module.exports = router;