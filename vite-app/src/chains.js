import { optimism } from 'viem/chains'

// for local development only
const hardhat = {
  id: 31337,
  name: 'Hardhat',
  network: 'hardhat',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://96840b1e-2730-42be-90ad-24aec5864eb3-00-2nhnen5ppgyub.spock.replit.dev:3000'] },
    default: { http: ['https://96840b1e-2730-42be-90ad-24aec5864eb3-00-2nhnen5ppgyub.spock.replit.dev:3000/'] },
  },
}

// make sure this contains the chain you want for your env
export const chains = [optimism];

export const projectId = '098f193a315fe026b6a8931f6359d9e2';

// make sure this is pointed at the right address
// export const EyeballerAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // hardhat
export const EyeballerAddress = '0x61eF625d36Df6456559ba64b4110bD21e4caf298'; // optimism