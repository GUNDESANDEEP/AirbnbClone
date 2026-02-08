const express = require('express');
const Property = require('../models/Property');
const { upload, uploadToCloudinary } = require('../utils/cloudinaryUpload');
const router = express.Router();

// Get properties by owner
router.get('/owner/:ownerId', async (req, res) => {
  const properties = await Property.find({ owner: req.params.ownerId });
  res.json(properties);
});
// Image upload endpoint
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = await uploadToCloudinary(req.file.buffer);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all properties with search and filter
router.get('/', async (req, res) => {
  const { location, minPrice, maxPrice, pool } = req.query;
  let filter = {};
  if (location) filter.location = { $regex: location, $options: 'i' };
  if (minPrice || maxPrice) filter.price = {};
  if (minPrice) filter.price.$gte = Number(minPrice);
  if (maxPrice) filter.price.$lte = Number(maxPrice);
  if (pool === 'true') filter.pool = true;
  if (pool === 'false') filter.pool = false;
  const properties = await Property.find(filter).populate('owner', 'name email');
  res.json(properties);
});

// Add property
router.post('/', async (req, res) => {
  const { title, description, location, price, images, pool, owner } = req.body;
  const property = new Property({ title, description, location, price, images, pool, owner });
  await property.save();
  res.status(201).json(property);
});


// Update a property
router.put('/:propertyId', async (req, res) => {
  const updated = await Property.findByIdAndUpdate(req.params.propertyId, req.body, { new: true });
  if (updated) {
    res.json(updated);
  } else {
    res.status(404).json({ error: 'Property not found' });
  }
});

// Delete a property
router.delete('/:propertyId', async (req, res) => {
  const deleted = await Property.findByIdAndDelete(req.params.propertyId);
  if (deleted) {
    res.json({ message: 'Property deleted' });
  } else {
    res.status(404).json({ error: 'Property not found' });
  }
});

module.exports = router;