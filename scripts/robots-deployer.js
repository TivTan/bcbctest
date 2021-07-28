// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // We get the contract to deploy
  const Robots = await hre.ethers.getContractFactory("Robots");
  const robots = await Robots.deploy(
    "MetaBots",
    "MTB",
    "ipfs://ipfs/QmbRcjZLuyFcBRmspTnxjex5SaYAFXhqcUffXQYJdi5vuh/metadata/"
  );
  await robots.deployed();

  console.log("Robots deployed to:", robots.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });