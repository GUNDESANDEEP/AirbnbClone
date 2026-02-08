import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header className="flex items-center justify-between p-4 bg-white shadow mb-4 sticky top-0 z-50">
      <div className="flex items-center space-x-2">
        <Link to="/" className="flex items-center">
          {/* Airbnb SVG Logo */}
          <svg viewBox="0 0 32 32" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g>
              <path d="M16.002 3.5c-2.1 0-3.9 1.1-5 3.1-1.1 2-1.1 4.3 0 6.3l7.7 13.3c.2.3.5.5.8.5.3 0 .6-.2.8-.5l7.7-13.3c1.1-2 1.1-4.3 0-6.3-1.1-2-2.9-3.1-5-3.1zm0 2c1.3 0 2.5.7 3.2 2 .7 1.3.7 2.9 0 4.2l-3.2 5.5-3.2-5.5c-.7-1.3-.7-2.9 0-4.2.7-1.3 1.9-2 3.2-2zm0 20.2l-6.7-11.6c-.8-1.4-.8-3.1 0-4.5.8-1.4 2.2-2.2 3.7-2.2s2.9.8 3.7 2.2c.8 1.4.8 3.1 0 4.5l-6.7 11.6zm0 0l6.7-11.6c.8-1.4.8-3.1 0-4.5-.8-1.4-2.2-2.2-3.7-2.2s-2.9.8-3.7 2.2c-.8 1.4-.8 3.1 0 4.5l6.7 11.6z" fill="#FF385C"/>
            </g>
          </svg>
          <span className="ml-2 text-2xl font-bold text-[#FF385C] tracking-tight">airbnb</span>
        </Link>
      </div>
      {/* Search Bar */}
      <form className="flex-1 flex justify-center mx-8">
        <input
          type="text"
          placeholder="Search destinations, properties..."
          className="w-full max-w-xl px-6 py-2 rounded-full border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF385C] text-gray-700 bg-gray-100 placeholder-gray-400"
          style={{ fontSize: '1rem' }}
          disabled
        />
      </form>
      <nav className="space-x-4">
        {isLoggedIn ? (
          <>
            <Link to="/dashboard" className="text-gray-700 hover:text-[#FF385C]">Dashboard</Link>
            <Link to="/owners" className="text-gray-700 hover:text-[#FF385C]">Owners</Link>
            <button onClick={handleLogout} className="bg-[#FF385C] text-white px-3 py-1 rounded hover:bg-[#e11d48]">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-gray-700 hover:text-[#FF385C]">Login</Link>
            <Link to="/register" className="text-gray-700 hover:text-[#FF385C]">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;
