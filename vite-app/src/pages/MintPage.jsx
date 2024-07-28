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
    pollingInterval: 1000,
    onLogs: (logs) => {
      const tokenIds = logs.map(log => log.args).filter(arg => arg.to == address).map(arg => arg.tokenId);
      if (isConfirmed && tokenIds.length > 0) {
        const tokenId = tokenIds[tokenIds.length - 1];
        fetch(`/api/${tokenId}/check`, { method: 'POST' }).then(res => res.json()).then(({ ok, error }) => {
          navigate(`/view/${tokenId}`);
        });
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
      {(!isConfirming && !isConfirmed) &&
        <>
          <p>Pluck one of these and become an Eyeballer. Maybe you'll get a really cool one.</p>
          <form onSubmit={submit}>
            {!priceIsPending &&
              <button type="submit" disabled={isMinting || priceIsPending}>{isMinting ? 'Minting...' : `Mint (${formatUnits(price, 18)} ETH)`}</button>}
          </form>
        </>}
      {hash && <p><a target="_blank" href={`https://optimistic.etherscan.io/tx/${hash}`}>View Transaction</a></p>}
      {isConfirming && <p>Confirming...</p>}
      {isConfirmed && 
        <>
          <p>Confirmed!</p>
          <p>As we speak, the AI computer is generating an eyeball picture just for you, and making up some wacky story about it.</p>
          <p>Meanwhile we wait to receive the Mint event from the blockchain, which will tell us your tokenId, at which point we will redirect you to the newly minted picture.</p>
          <p>I agree with you that this is taking too long! But, you know, a little patience. It's all probably working fine.</p>
          <p>Cross your fingers for a cool one...</p>
        </>}
      {error && <p>Error: {error.shortMessage || error.message}</p>}
    </div>
  );
}