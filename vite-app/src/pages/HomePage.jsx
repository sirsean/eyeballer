import { EyeballerAddress } from '../chains';
import EyeballerABI from '../abi/EyeballerABI.json';
import { useReadContracts } from 'wagmi'
import { formatUnits } from 'viem'

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

  return (
    <>
      <div className="HomePage">
        <p><a href="https://dinero.xyz" target="_blank">Dinero Protocol</a> is pushing the boundaries of decentralized money, and we're here because we dig that. They're doing some cool stuff over there.</p>
        <p>For some reason, their logo is an eyeball.</p>
        <p>Eyeballer is an NFT project, in honor of Dinero but not affiliated with it, that consists of 10k <em>unique</em> images of eyeballs. Unlike yours, these ones don't come in pairs.</p>
        <p>Show your Dinero appreciation, pluck one for yourself, be an Eyeballer.</p>
        <p>Total supply: {isPending ? '...' : totalSupply?.result?.toString()}</p>
        <p>Price: {isPending? '...' : `${formatUnits(price.result, 18)} ETH`}</p>
        <p>* I hope you get a picture you like! You should not really expect it to increase in value, or to get any airdrops. We're doing this for fun.</p>
      </div>
    </>
  );
}