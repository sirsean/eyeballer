import { useEffect, useState } from "react";
import { useReadContract, useReadContracts, useAccount } from "wagmi";
import { EyeballerAddress } from '../chains';
import EyeballerABI from '../abi/EyeballerABI.json';
import GalleryToggle from '../components/GalleryToggle';
import Gallery from '../components/Gallery';

function FullGallery() {
  const [tokenIds, setTokenIds] = useState([]);

  const {
    data: totalSupply,
    isPending: totalSupplyIsPending,
  } = useReadContract({
    address: EyeballerAddress,
    abi: EyeballerABI.abi,
    functionName: 'totalSupply',
  });

  useEffect(() => {
    if (totalSupply) {
      const ids = Array.from({ length: Number(totalSupply) }, (_, i) => i + 1);
      setTokenIds(ids);
    }
  }, [totalSupply]);

  if (totalSupplyIsPending) {
    return <div className="Loading">Loading...</div>;
  }
  
  return (
    <Gallery tokenIds={tokenIds} />
  );
}

function MyGallery() {
  const { address } = useAccount();

  const {
    data: balance,
    isPending: balanceIsPending,
  } = useReadContract({
    address: EyeballerAddress,
    abi: EyeballerABI.abi,
    functionName: 'balanceOf',
    args: [address],
  });

  const {
    data: tokenIdResults,
    isPending: tokensIsPending,
  } = useReadContracts({
    contracts: Array.from({ length: Number(balance) }, (_, i) => i).map(index => {
      return {
        address: EyeballerAddress,
        abi: EyeballerABI.abi,
        functionName: 'tokenOfOwnerByIndex',
        args: [address, index],
      };
    }),
  });

  if (balanceIsPending || (balance > 0n && tokensIsPending)) {
    return <div className="Loading">Loading...</div>;
  }

  const tokenIds = (tokenIdResults || []).map(result => result.result).map(tokenId => Number(tokenId));
  
  return (
    <Gallery tokenIds={tokenIds} />
  );
}

export default function GalleryPage() {
  const { isConnected } = useAccount();
  const [showMine, setShowMine] = useState(false);

  return (
    <div className="GalleryPage">
      {isConnected &&
        <GalleryToggle showMine={showMine} setShowMine={setShowMine} />}
      {showMine && <MyGallery />}
      {!showMine && <FullGallery />}
    </div>
  );
}