import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import GalleryPage from './pages/GalleryPage';
import ViewPage from './pages/ViewPage';
import './App.css'

function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/view/:tokenId" element={<ViewPage />} />
      </Routes>
    </Router>
  )
}

export default App
