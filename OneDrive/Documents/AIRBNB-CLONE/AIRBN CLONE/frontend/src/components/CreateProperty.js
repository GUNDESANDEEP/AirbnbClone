import React, { useState } from 'react';
import api from '../api';

function CreateProperty({ ownerId }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState([]); // Array of Cloudinary URLs
  const [imageFiles, setImageFiles] = useState([]); // Array of File objects
  const [uploading, setUploading] = useState(false);
  const [pool, setPool] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleImageChange = (e) => {
    setImageFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setUploading(true);
    let uploadedUrls = [];
    try {
      // Upload images to backend (Cloudinary)
      for (let file of imageFiles) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await api.post('/properties/upload-image', formData);
        if (res.data && res.data.url) {
          uploadedUrls.push(res.data.url);
        } else {
          throw new Error('Image upload failed');
        }
      }
      setImages(uploadedUrls);
      // Now create property with image URLs
      const token = localStorage.getItem("token");
      const res = await api.post(
        "/properties",
        {
          title,
          description,
          location,
          price: Number(price),
          images: uploadedUrls,
          pool,
          owner: ownerId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 201) {
        setMessage("Property created successfully!");
        setTitle(""); setDescription(""); setLocation(""); setPrice(""); setImages([]); setImageFiles([]); setPool(false);
      } else {
        setError(res.data?.error || "Failed to create property");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Network error");
    }
    setUploading(false);
  };

  return (
    <div className="container mx-auto p-4 max-w-lg">
      <h2 className="text-xl font-bold mb-4">Create Property</h2>
      {message && <div className="text-green-600 mb-2">{message}</div>}
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Title</label>
          <input type="text" className="w-full border px-3 py-2 rounded" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1">Description</label>
          <textarea className="w-full border px-3 py-2 rounded" value={description} onChange={e => setDescription(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1">Location</label>
          <input type="text" className="w-full border px-3 py-2 rounded" value={location} onChange={e => setLocation(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1">Price</label>
          <input type="number" className="w-full border px-3 py-2 rounded" value={price} onChange={e => setPrice(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1">Images (upload one or more)</label>
          <input type="file" multiple accept="image/*" onChange={handleImageChange} className="w-full" />
          {uploading && <div className="text-blue-600">Uploading images...</div>}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {images.map((url, idx) => (
                <img key={idx} src={url} alt="Preview" className="w-16 h-16 object-cover rounded" />
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center">
          <input type="checkbox" id="pool" checked={pool} onChange={e => setPool(e.target.checked)} />
          <label htmlFor="pool" className="ml-2">Has Pool</label>
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Create Property</button>
      </form>
    </div>
  );
}

export default CreateProperty;
