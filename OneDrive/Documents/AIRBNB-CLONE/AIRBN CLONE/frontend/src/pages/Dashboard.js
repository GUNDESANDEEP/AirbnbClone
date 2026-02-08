import React, { useEffect, useState } from 'react';
import api from '../api';

function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.id;
    Promise.all([
      api.get(`/bookings/user/${userId}`),
      api.get(`/properties/owner/${userId}`),
    ]).then(([bookingsRes, propertiesRes]) => {
      setBookings(bookingsRes.data);
      setProperties(propertiesRes.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">My Dashboard</h2>
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">My Bookings</h3>
        {bookings.length === 0 ? (
          <p>No bookings yet.</p>
        ) : (
          <ul className="space-y-2">
            {bookings.map(b => (
              <li key={b._id} className="border p-2 rounded">
                <div className="font-semibold">{b.property?.title || 'Property deleted'}</div>
                <div>From: {new Date(b.startDate).toLocaleDateString()} To: {new Date(b.endDate).toLocaleDateString()}</div>
                <div>Total Price: ${b.totalPrice}</div>
                <button
                  className="mt-2 bg-red-500 text-white px-2 py-1 rounded"
                  onClick={async () => {
                    if (!window.confirm('Cancel this booking?')) return;
                    await api.delete(`/bookings/${b._id}`);
                    setBookings(bookings.filter(x => x._id !== b._id));
                  }}
                >Cancel Booking</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">My Listings</h3>
        {properties.length === 0 ? (
          <p>No properties listed yet.</p>
        ) : (
          <ul className="space-y-2">
            {properties.map(p => (
              <li key={p._id} className="border p-2 rounded">
                <div className="font-semibold">{p.title}</div>
                <div>Location: {p.location}</div>
                <div>Price: ${p.price}</div>
                <div>{p.pool ? 'Has Pool' : 'No Pool'}</div>
                <button
                  className="mt-2 bg-red-500 text-white px-2 py-1 rounded mr-2"
                  onClick={async () => {
                    if (!window.confirm('Delete this property?')) return;
                    await api.delete(`/properties/${p._id}`);
                    setProperties(properties.filter(x => x._id !== p._id));
                  }}
                >Delete</button>
                <button
                  className="mt-2 bg-blue-500 text-white px-2 py-1 rounded"
                  onClick={async () => {
                    const newTitle = prompt('Update title:', p.title);
                    if (!newTitle || newTitle === p.title) return;
                    const res = await api.put(`/properties/${p._id}`, { title: newTitle });
                    if (res.status === 200) {
                      setProperties(properties.map(x => x._id === p._id ? { ...x, title: newTitle } : x));
                    }
                  }}
                >Update Title</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
