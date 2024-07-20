import { EyeballerAddress } from '../chains';
import EyeballerABI from '../abi/EyeballerABI.json';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent, useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import { useNavigate } from 'react-router-dom';

export default function MintPage() {
  const { address } = useAccount();
  const navigate = useNavigate();
  
  const {
    data: price,
    isPending: priceIsPending,
  } = useReadContract({
    address: EyeballerAddress,
    abi: EyeballerABI.abi,
    functionName: 'price',
  });
  
  const { 
    data: hash,
    isPending: isMinting,
    error,
    writeContract,
  } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash,
  });

  useWatchContractEvent({
    address: EyeballerAddress,
    abi: EyeballerABI.abi,
    eventName: 'Mint',
    onLogs: (logs) => {
      const tokenIds = logs.map(log => log.args).filter(arg => arg.to == address).map(arg => arg.tokenId);
      if (isConfirmed && tokenIds.length > 0) {
        const tokenId = tokenIds[tokenIds.length - 1];
        navigate(`/view/${tokenId}`);
      }
    },
  });
  
  const submit = async (event) => {
    event.preventDefault();
    
    writeContract({
      address: EyeballerAddress,
      abi: EyeballerABI.abi,
      functionName: 'mint',
      args: [],
      value: price,
    });
  };
  
  return (
    <div className="MintPage">
      <p>Pluck one of these and become an Eyeballer. Maybe you'll get a really cool one.</p>
      <form onSubmit={submit}>
        {!priceIsPending &&
          <button type="submit" disabled={isMinting || priceIsPending}>{isMinting ? 'Minting...' : `Mint (${formatUnits(price, 18)} ETH)`}</button>}
      </form>
      {hash && <p>{hash}</p>}
      {isConfirming && <p>Confirming...</p>}
      {isConfirmed && <p>Confirmed!</p>}
      {error && <p>Error: {error.shortMessage || error.message}</p>}
    </div>
  );
}