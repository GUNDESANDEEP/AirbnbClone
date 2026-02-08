import React, { useEffect, useState } from 'react';
import api from '../api';


function PropertiesList({ isLoggedIn }) {
  const [properties, setProperties] = useState([]);
  const [bookingState, setBookingState] = useState({}); // { [propertyId]: { startDate, endDate, message, error, loading } }
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [pool, setPool] = useState("");

  const fetchProperties = () => {
    setLoading(true);
    let query = [];
    if (location) query.push(`location=${encodeURIComponent(location)}`);
    if (minPrice) query.push(`minPrice=${minPrice}`);
    if (maxPrice) query.push(`maxPrice=${maxPrice}`);
    if (pool) query.push(`pool=${pool}`);
    const url = `/properties${query.length ? '?' + query.join('&') : ''}`;
    api.get(url)
      .then(res => {
        setProperties(res.data);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchProperties();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [isLoggedIn]);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchProperties();
  };

  if (!isLoggedIn) {
    // Show background animation or placeholder for guests
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gradient-to-r from-blue-200 to-purple-200 animate-pulse rounded-lg mt-8">
        <p className="text-2xl text-gray-600">Login to see real properties!</p>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleFilter} className="flex flex-wrap gap-2 items-end mb-6">
        <div>
          <label className="block text-sm">Location</label>
          <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="border px-2 py-1 rounded" placeholder="City or area" />
        </div>
        <div>
          <label className="block text-sm">Min Price</label>
          <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="border px-2 py-1 rounded" />
        </div>
        <div>
          <label className="block text-sm">Max Price</label>
          <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="border px-2 py-1 rounded" />
        </div>
        <div>
          <label className="block text-sm">Pool</label>
          <select value={pool} onChange={e => setPool(e.target.value)} className="border px-2 py-1 rounded">
            <option value="">Any</option>
            <option value="true">Has Pool</option>
            <option value="false">No Pool</option>
          </select>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Search</button>
      </form>
      {loading ? (
        <div>Loading properties...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {properties.map((property) => {
            const state = bookingState[property._id] || { startDate: '', endDate: '', message: '', error: '', loading: false };
            return (
              <div key={property._id} className="card">
                {property.images && property.images[0] && (
                  <img src={property.images[0]} alt={property.title} className="w-full h-48 object-cover rounded-2xl mb-3" />
                )}
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-lg font-bold">{property.title}</h3>
                  <span className="text-[#FF385C] font-bold text-lg">${property.price}</span>
                </div>
                <p className="text-gray-600 mb-1">{property.location}</p>
                <p className="mb-1 text-sm">{property.pool ? 'Has Pool' : 'No Pool'}</p>
                <p className="text-xs text-gray-400 mb-2">Owner: {property.owner?.name || 'N/A'}</p>
                <form
                  className="mt-2 space-y-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setBookingState((prev) => ({ ...prev, [property._id]: { ...state, loading: true, message: '', error: '' } }));
                    try {
                      const token = localStorage.getItem('token');
                      const payload = JSON.parse(atob(token.split('.')[1]));
                      // Check if user is eligible for discount
                      let discountedPrice = property.price;
                      const checkRes = await api.get(`/bookings/check-discount?property=${property._id}&user=${payload.id}`);
                      if (checkRes.data && checkRes.data.discountedPrice) {
                        discountedPrice = checkRes.data.discountedPrice;
                      }
                      const res = await api.post(
                        '/bookings',
                        {
                          property: property._id,
                          user: payload.id,
                          startDate: state.startDate,
                          endDate: state.endDate,
                          totalPrice: discountedPrice,
                        },
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      if (res.status === 201) {
                        setBookingState((prev) => ({ ...prev, [property._id]: { ...state, loading: false, message: `Booking successful! Price: $${discountedPrice}`, error: '' } }));
                      } else {
                        setBookingState((prev) => ({ ...prev, [property._id]: { ...state, loading: false, message: '', error: res.data?.error || 'Booking failed' } }));
                      }
                    } catch (err) {
                      setBookingState((prev) => ({ ...prev, [property._id]: { ...state, loading: false, message: '', error: 'Network error' } }));
                    }
                  }}
                >
                  <div>
                    <label className="block text-xs">Start Date</label>
                    <input
                      type="date"
                      value={state.startDate}
                      onChange={e => setBookingState(prev => ({ ...prev, [property._id]: { ...state, startDate: e.target.value } }))}
                      className="border px-2 py-1 rounded w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs">End Date</label>
                    <input
                      type="date"
                      value={state.endDate}
                      onChange={e => setBookingState(prev => ({ ...prev, [property._id]: { ...state, endDate: e.target.value } }))}
                      className="border px-2 py-1 rounded w-full"
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full" disabled={state.loading}>
                    {state.loading ? 'Booking...' : 'Book'}
                  </button>
                  {state.message && <div className="text-green-600 text-sm mt-1">{state.message}</div>}
                  {state.error && <div className="text-red-500 text-sm mt-1">{state.error}</div>}
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PropertiesList;
