import { EyeballerAddress } from '../chains';
import EyeballerABI from '../abi/EyeballerABI.json';
import { useReadContracts } from 'wagmi'
import { formatUnits } from 'viem'
import Gallery from '../components/Gallery';
import { useState, useEffect } from 'react';

function getShuffledArray(n) {
  // Generate an array from 1 to n
  const array = Array.from({ length: n }, (_, i) => i + 1);

  // Shuffle the array using the Fisher-Yates algorithm
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }

  // Return the first 4 elements of the shuffled array
  return array.slice(0, 4);
}

export default function HomePage() {
  const {
    data,
    isPending,
  } = useReadContracts({
    contracts: [
      {
        address: EyeballerAddress,
        abi: EyeballerABI.abi,
        functionName: 'totalSupply',
      },
      {
        address: EyeballerAddress,
        abi: EyeballerABI.abi,
        functionName: 'price',
      },
    ],
  });

  const [totalSupply, price] = data || [];

  const [tokenIds, setTokenIds] = useState([]);

  useEffect(() => {
    if (totalSupply) {
      setTokenIds(getShuffledArray(Number(totalSupply.result)).map(Number));
    }
  }, [totalSupply]);

  return (
    <>
      <div className="HomePage">
        <p><a href="https://dinero.xyz" target="_blank">Dinero Protocol</a> is pushing the boundaries of decentralized money, and we're here because we dig that. They're doing some cool stuff over there.</p>
        <p>For some reason, their logo is an eyeball.</p>
        <p>Eyeballer is an NFT project, in honor of Dinero but not affiliated with it, that consists of 10k <em>unique</em> images of eyeballs. Unlike yours, these ones don't come in pairs.</p>
        <p>Show your Dinero appreciation, pluck one for yourself, be an Eyeballer. It'll cost you {(isPending || !price) ? '...' : `${formatUnits(price.result, 18)} ETH`}.</p>
        <Gallery tokenIds={tokenIds} />
        <p>* I hope you get a picture you like! You should not really expect it to increase in value, or to get any airdrops. We're doing this for fun.</p>
      </div>
    </>
  );
}