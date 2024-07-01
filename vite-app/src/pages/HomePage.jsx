import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="HomePage">
      <h1>Welcome to Eyeballer</h1>
      <Link to="/gallery">Gallery</Link>
      <Link to="/view/1">View #1</Link>
    </div>
  );
}