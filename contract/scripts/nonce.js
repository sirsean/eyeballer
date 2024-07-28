async function main() {
  const nonce = parseInt(process.env.NONCE);
  if (isNaN(nonce)) {
    console.error('Please provide a valid nonce value.');
    process.exit(1);
  }
  
  const address = "0x560EBafD8dB62cbdB44B50539d65b48072b98277";  // Replace with your wallet address

  await network.provider.send("hardhat_setNonce", [address, `0x${nonce.toString(16)}`]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });