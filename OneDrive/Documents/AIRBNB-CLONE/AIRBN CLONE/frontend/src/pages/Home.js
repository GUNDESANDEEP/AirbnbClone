import React from 'react';
import CreateProperty from '../components/CreateProperty';
import PropertiesList from '../components/PropertiesList';

function Home() {
  // Decode JWT to get user id (owner)
  let ownerId = null;
  let isLoggedIn = false;
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      ownerId = payload.id;
      isLoggedIn = true;
    } catch {}
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold">Welcome to Airbnb Clone</h1>
      <p>Find your next stay!</p>
      {ownerId && (
        <div className="my-8">
          <CreateProperty ownerId={ownerId} />
        </div>
      )}
      <PropertiesList isLoggedIn={isLoggedIn} />
    </div>
  );
}

export default Home;