async function main() {
  const nonce = 22;
  const address = "0x560EBafD8dB62cbdB44B50539d65b48072b98277";  // Replace with your wallet address

  await network.provider.send("hardhat_setNonce", [address, `0x${nonce.toString(16)}`]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });