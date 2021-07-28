const { expect } = require("chai");
const { utils, BigNumber } = require("ethers");

describe("Robot", function () {
  it("Should have the correct URI for the minted tokens", async function () {
    // Load accounts
    const [deployer, recipient1] = await ethers.getSigners();

    // Deploy the Robot contract
    const Robots = await ethers.getContractFactory("Robots");
    const robots = await Robots.deploy(
      "MetaBots",
      "MTB",
      "ipfs://ipfs/QmZwBqYHXpU2tm6GR8Upqqy7RkFckgnNbnmg74RX6iGrfM/metadata/"
      );

      // Wait for the Robot contract to be deployed
      await robots.deployed();
  
      // Mint the first robot to self
      await robots.mint(recipient1.address);
  
      // Check that token is minted correctly to the recipient
      const ownerOfFirstToken = await robots.ownerOf(0);
      expect(ownerOfFirstToken).to.equal(recipient1.address);
  
      // Check that the url of the token is correct
      const urlOfFirstToken = await robots.tokenURI(0);
      expect(urlOfFirstToken).to.equal("ipfs://ipfs/QmZwBqYHXpU2tm6GR8Upqqy7RkFckgnNbnmg74RX6iGrfM/metadata/0");

      // Check that purchase can be made
      const devBalanceBeforePurchase = await deployer.getBalance();
      await robots.connect(recipient1).purchase({ value: utils.parseEther("1") });
      const ownerOfSecondToken = await robots.ownerOf(1);
      expect(ownerOfSecondToken).to.equal(recipient1.address);
  
      // Check that developer balance increased
      const devBalanceAfterPurchase = await deployer.getBalance();
      expect(devBalanceAfterPurchase).to.equal(
        devBalanceBeforePurchase.add(BigNumber.from(utils.parseEther("1")))
      );
    });
  });