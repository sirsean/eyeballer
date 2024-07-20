const { ethers } = require("hardhat");

async function main() {
  const [sender] = await ethers.getSigners();
  const receiver = "0x560EBafD8dB62cbdB44B50539d65b48072b98277";  // Replace with your wallet address

  const amountInEther = "1";  // Amount to send in Ether

  console.log(`Attempting to send ${amountInEther} ETH from ${sender.address} to ${receiver}`);

  const tx = await sender.sendTransaction({
    to: receiver,
    value: ethers.parseEther(amountInEther)
  });

  await tx.wait();
  console.log(`Transaction successful with hash: ${tx.hash}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });