import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import './Gallery.css';

export default function Gallery({ tokenIds }) {
  const observer = useRef(null);

  useEffect(() => {
    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          observer.current.unobserve(img);
        }
      });
    });

    const imgs = document.querySelectorAll("img[data-src]");
    imgs.forEach(img => {
      observer.current.observe(img);
    });

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [tokenIds]);

  return (
    <div className="gallery">
      {tokenIds.map(tokenId => (
        <div key={tokenId} className="thumbnail-container">
          <Link to={`/view/${tokenId}`}>
            <img
              data-src={`/thumb/${tokenId}.png`}
              className="thumbnail"
              />
            <div className="overlay">#{tokenId}</div>
          </Link>
        </div>
      ))}
    </div>
  );
}