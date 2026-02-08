const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: String,
  description: String,
  location: String,
  price: Number,
  images: [String],
  pool: { type: Boolean, default: false },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
});

module.exports = mongoose.model('Property', propertySchema);