import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

async function fetchMaxTokenId() {
  const response = await fetch("/api/max-token-id");
  const data = await response.json();
  return data.maxTokenId;
}

export default function GalleryPage() {
  const [tokenIds, setTokenIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const observer = useRef(null);

  useEffect(() => {
    const fetchTokenIds = async () => {
      setLoading(true);
      const maxTokenId = await fetchMaxTokenId();
      const ids = Array.from({ length: maxTokenId }, (_, i) => i + 1);
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

  if (loading) {
    return <div className="Loading">Loading...</div>;
  }
  
  return (
    <div className="GalleryPage">
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
    </div>
  );
}