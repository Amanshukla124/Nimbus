import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { TrackPage } from './pages/TrackPage';
import { AirportPage } from './pages/AirportPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0b0e14] text-[#ecedf6] overflow-x-hidden">
        <Navbar />
        <Routes>
          <Route path="/" element={<TrackPage />} />
          <Route path="/airport/:iata" element={<AirportPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
