# Eyeballer

NFT dapp for 10k eyeballs.

## Run it locally

```bash
npm install
npm run dev
```

The `npm run dev` command will concurrently start the backend server, a Hardhat node, and the Vite frontend server.

You will then want to set up the contract for local development.

```bash
npm run dev:contract:deploy
npm run dev:contract:seed
```

This will deploy the contract on your Hardhat node and send 1 ETH from the built-in Hardhat wallet to my wallet so you can spend it in the browser.

As you develop, you will make transactions with your wallet. This will advance the nonce. Then every time you restart Hardhat, the nonce will be reset on the node but not on your wallet. You can figure out how to reset your wallet, or you can advance the nonce on the node.

```bash
NONCE=27 npm run dev:contract:nonce
```

As you develop, the max-token-id will increment itself with the test mints. You may want to reset this value.

```bash
MAX_TOKEN_ID=0 npm run dev:reset-max-token-id
```