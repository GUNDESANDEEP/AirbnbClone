import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Header from './components/Header';
import OwnersList from './components/OwnersList';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/owners" element={<OwnersList />} />
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Add more routes as needed */}
          </Routes>
        </main>
        <footer className="bg-white border-t py-6 text-center text-sm text-gray-500 mt-8">
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-center px-4">
            <div className="mb-2 md:mb-0">&copy; {new Date().getFullYear()} Airbnb Clone. Not affiliated with Airbnb.</div>
            <div className="space-x-4">
              <a href="#" className="hover:text-[#FF385C]">Privacy</a>
              <a href="#" className="hover:text-[#FF385C]">Terms</a>
              <a href="#" className="hover:text-[#FF385C]">Sitemap</a>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;