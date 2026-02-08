import React, { useEffect, useState } from 'react';
import api from '../api';

function OwnersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    api.get('/auth/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setUsers(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch users');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading users...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4 max-w-lg">
      <h2 className="text-xl font-bold mb-4">Registered Users</h2>
      <ul className="space-y-2">
        {users.map(user => (
          <li key={user._id} className="border p-2 rounded">
            <span className="font-semibold">{user.name}</span> - {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default OwnersList;
