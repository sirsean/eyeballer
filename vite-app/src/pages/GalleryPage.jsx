import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function GalleryPage() {
  const [tokenIds, setTokenIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const observer = useRef(null);

  useEffect(() => {
    const fetchTokenIds = async () => {
      setLoading(true);
      const ids = Array.from({ length: 10000 }, (_, i) => i + 1);
      setTokenIds(ids);
      setLoading(false);
    };
    fetchTokenIds();
  }, []);

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
    <div className="GalleryPage">
      <h1>Gallery</h1>
      <div className="gallery">
        {tokenIds.map(tokenId => (
          <div className="thumbnail-container">
            <Link key={tokenId} to={`/view/${tokenId}`}>
              <img
                data-src={`/thumb/${tokenId}.png`}
                className="thumbnail"
                />
              <div className="overlay">#{tokenId}</div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}