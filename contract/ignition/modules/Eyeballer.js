const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers } = require("hardhat");

const PRICE = ethers.parseEther("0.001");

module.exports = buildModule("EyeballerModule", (m) => {
  const price = m.getParameter("price", PRICE);

  const eyeballer = m.contract("Eyeballer", [price]);

  return { eyeballer };
});