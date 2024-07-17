const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Eyeballer", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployEyeballerFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Eyeballer = await ethers.getContractFactory("Eyeballer");
    const eyeballer = await Eyeballer.deploy(0);

    return { eyeballer, owner, otherAccount };
  }
  
  async function deployERC20Fixture() {
    const [owner] = await ethers.getSigners();

    const ERC20 = await ethers.getContractFactory("TestERC20");
    const erc20 = await ERC20.deploy(1000);

    return { erc20, owner };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { eyeballer, owner } = await loadFixture(deployEyeballerFixture);

      expect(await eyeballer.owner()).to.equal(owner.address);
    });

    it("Should set the initial price", async function () {
      const Eyeballer = await ethers.getContractFactory("Eyeballer");
      const eyeballer = await Eyeballer.deploy(100);

      expect(await eyeballer.price()).to.equal(100);
    });
  });

  describe("Mint", function() {
    it("Should be able to mint a token", async function () {
      const { eyeballer, owner } = await loadFixture(deployEyeballerFixture);

      // mint tokenId=1
      await eyeballer.mint();

      // check that the owner now has a balanceOf 1 token
      expect(await eyeballer.balanceOf(owner.address)).to.equal(1);

      // check that tokenId=1 is minted to the owner
      expect(await eyeballer.ownerOf(1)).to.equal(owner.address);
    });

    it("Should allow non-owners to mint tokens", async function() {
      const { eyeballer, otherAccount } = await loadFixture(deployEyeballerFixture);

      // mint tokenId=1
      await eyeballer.connect(otherAccount).mint();

      // check that the otherAccount now has a balanceOf 1 token
      expect(await eyeballer.balanceOf(otherAccount.address)).to.equal(1);

      // check that tokenId=1 is minted to the otherAccount
      expect(await eyeballer.ownerOf(1)).to.equal(otherAccount.address);
    });

    it("Should require the minting cost to be paid", async function() {
      const { eyeballer } = await loadFixture(deployEyeballerFixture);

      // set the price
      await eyeballer.setPrice(10);

      await expect(eyeballer.mint()).to.be.revertedWith("send the right amount of ETH");
      await expect(eyeballer.mint({ value: 5 })).to.be.revertedWith("send the right amount of ETH");
      await expect(eyeballer.mint({ value: 20 })).to.be.revertedWith("send the right amount of ETH");
    });

    it("Should charge the minting cost and send it to the owner", async function() {
      const { eyeballer, owner, otherAccount } = await loadFixture(deployEyeballerFixture);

      // set the price
      await eyeballer.setPrice(10);

      // mint tokenId=1
      await expect(eyeballer.connect(otherAccount).mint({ value: 10 })).to.changeEtherBalances(
        [otherAccount, eyeballer],
        [-10, 10]
      );

      // and withdraw
      await expect(eyeballer.connect(owner).withdraw()).to.changeEtherBalances(
        [owner, eyeballer],
        [10, -10]
      );
    });

    it("Should track the current supply as tokens get minted", async function() {
      const { eyeballer } = await loadFixture(deployEyeballerFixture);

      // check that the current supply is 0
      expect(await eyeballer.totalSupply()).to.equal(0);
      
      // mint tokenId=1
      await eyeballer.mint();

      // check that the current supply is 1
      expect(await eyeballer.totalSupply()).to.equal(1);

      // mint tokenId=2
      await eyeballer.mint();

      // check that the current supply is 2
      expect(await eyeballer.totalSupply()).to.equal(2);
    });

    it("Should emit an event on minting", async function() {
      const { eyeballer, owner } = await loadFixture(deployEyeballerFixture);

      await expect(eyeballer.mint())
        .to.emit(eyeballer, "Mint")
        .withArgs(owner.address, 1);
    });

    /*
    // this is sooo slow
    it("Should mint 10k, but not more", async function() {
      const { eyeballer, owner } = await loadFixture(deployEyeballerFixture);

      // check that the current supply is 0
      expect(await eyeballer.totalSupply()).to.equal(0);
      
      // mint 10k tokens
      for (let i = 0; i < 10_000; i++) {
        await eyeballer.mint();
      }

      // check that the current supply is 10k
      expect(await eyeballer.totalSupply()).to.equal(10_000);

      // minting one more fails
      await expect(eyeballer.mint()).to.be.revertedWith("that's enough eyeballs");
    });
    */
  });

  describe("TokenURI", function() {
    it("Should return the correct tokenURI for tokenId=1", async function() {
      const { eyeballer } = await loadFixture(deployEyeballerFixture);

      // mint tokenId=1
      await eyeballer.mint();

      // check that the tokenURI is correct
      expect(await eyeballer.tokenURI(1)).to.equal("https://eyeballer.replit.app/metadata/1.json");
    });

    it("Should allow the baseURI to change", async function() {
      const { eyeballer } = await loadFixture(deployEyeballerFixture);

      // set the baseURI
      await eyeballer.setBaseURI("https://eyeballer.com/base");

      // mint tokenId=1
      await eyeballer.mint();

      // check that the tokenURI is correct
      expect(await eyeballer.tokenURI(1)).to.equal("https://eyeballer.com/base/1.json");
    });
  });

  describe("Receive ETH and withdraw it", function() {
    it("Should revert if the contract has no ETH balance", async function() {
      const { eyeballer } = await loadFixture(deployEyeballerFixture);

      await expect(eyeballer.withdraw()).to.be.revertedWith("no ETH balance");
    });
    
    it("Should allow the owner to withdraw ETH", async function() {
      const { eyeballer, owner } = await loadFixture(deployEyeballerFixture);

      // send some eth to the contract
      await expect(owner.sendTransaction({
        to: await eyeballer.getAddress(),
        value: 500,
      })).to.changeEtherBalances(
        [owner, eyeballer],
        [-500, 500],
      );

      // withdraw the eth back
      await expect(eyeballer.connect(owner).withdraw()).to.changeEtherBalances(
        [owner, eyeballer],
        [500, -500],
      );
    });
  });

  describe("Receive generic ERC20 tokens and withdraw them", function() {
    it("Should revert if the contract has no ERC20 balance", async function() {
      const { eyeballer, owner } = await loadFixture(deployEyeballerFixture);
      const { erc20 } = await loadFixture(deployERC20Fixture);

      await expect(eyeballer.withdrawERC20(await erc20.getAddress())).to.be.revertedWith("no token balance");
    });
    
    it("Should allow the owner to withdraw generic ERC20 tokens", async function() {
      const { eyeballer, owner } = await loadFixture(deployEyeballerFixture);
      const { erc20 } = await loadFixture(deployERC20Fixture);

      // send some tokens to the contract
      await expect(erc20.transfer(await eyeballer.getAddress(), 100))
        .to.changeTokenBalances(erc20, [owner, eyeballer], [-100, 100]);

      // withdraw the tokens back
      await expect(eyeballer.connect(owner).withdrawERC20(await erc20.getAddress()))
        .to.changeTokenBalances(erc20, [owner, eyeballer], [100, -100]);
    });
  });
});