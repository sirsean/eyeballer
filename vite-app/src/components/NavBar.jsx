import { Link } from 'react-router-dom';
import "./NavBar.css";

export default function NavBar() {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-logo">
          <img src="/android-chrome-512x512.png" alt="Eyeballer" className="navbar-logo-image" />
          <span className="navbar-title">Eyeballer</span>
        </Link>
      </div>
      <div className="navbar-right">
        <Link to="/gallery" className="navbar-link">Gallery</Link>
        <Link to="/mint" className="navbar-link">Mint</Link>
        <w3m-button />
      </div>
    </nav>
  );
}