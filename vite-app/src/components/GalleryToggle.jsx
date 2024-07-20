import React from 'react';
import './GalleryToggle.css';

export default function GalleryToggle({ showMine, setShowMine }) {
  const handleToggle = () => {
    setShowMine(!showMine);
  };

  return (
    <div className="toggle-container">
      <button className={`toggle-button ${showMine ? 'active' : ''}`} onClick={handleToggle}>
        Mine
      </button>
      <button className={`toggle-button ${!showMine ? 'active' : ''}`} onClick={handleToggle}>
        All
      </button>
    </div>
  );
};