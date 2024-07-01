import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

async function fetchMetadata({ tokenId, setMetadata, setError, setLoading }) {
  setLoading(true);
  return fetch(`/metadata/${tokenId}.json`)
    .then((res) => {
      if (!res.ok) {
        throw new Error(res.statusText);
      }
      return res.json();
    })
    .then(setMetadata)
    .catch(setError)
    .finally(() => setLoading(false));
}

export default function ViewPage() {
  const { tokenId } = useParams();
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMetadata({ tokenId, setMetadata, setError, setLoading });
  }, [tokenId]);

  if (loading) {
    return <div className="Loading">Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!metadata) {
    return;
  }
  
  return (
    <div className="ViewPage">
      <h1>{metadata.name}</h1>
      <img className="Token" src={`/image/${tokenId}.png`} />
      <p className="Description">{metadata.description}</p>
    </div>
  );
}