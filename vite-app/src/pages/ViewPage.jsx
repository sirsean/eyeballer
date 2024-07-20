import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

async function fetchMetadata({ tokenId, setMetadata, setError, setLoading }) {
  setLoading(true);
  return fetch(`/metadata/${tokenId}.json`)
    .then(async (res) => {
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || res.statusText);
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
    const submit = (e) => {
      e.preventDefault();
      fetch(`/api/${tokenId}/check`, { method: 'POST' })
        .then(res => res.json())
        .then(({ ok, error }) => {
          if (ok) {
            window.location.reload();
          }
        });
    }
    return (
      <div className="error">
        Error: {error.message}
        <form onSubmit={submit}>
          <button>Check Metadata</button>
        </form>
      </div>
    );
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