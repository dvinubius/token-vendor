// deploy/01_deploy_vendor.js

const { ethers } = require("hardhat");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  // You might need the previously deployed yourToken:
  const soRadToken = await ethers.getContract("SoRadToken", deployer);

  await deploy("Vendor", {
    from: deployer,
    args: [soRadToken.address], // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    log: true,
  });

  const vendor = await ethers.getContract("Vendor", deployer);

  console.log("\n 🏵  Sending all 1000 tokens to the vendor...\n");

  const transferTransaction = await soRadToken.transfer(
    vendor.address,
    ethers.utils.parseEther("1000")
  );

  console.log("\n    ✅ confirming...\n");
  await sleep(5000); // wait 5 seconds for transaction to propagate

  // console.log("\n 🤹  Sending ownership to frontend address...\n");
  // const ownershipTransaction = await vendor.transferOwnership(
  //   "0x967752A2a06b0bD0519A08d496D988BcC6156CD7"
  // );
  // console.log("\n    ✅ confirming...\n");
  // const ownershipResult = await ownershipTransaction.wait();

  // ToDo: Verify your contract with Etherscan for public chains
  if (chainId !== "31337") {
    try {
      console.log(" 🎫 Verifing Contract on Etherscan... ");
      await sleep(15000); // wait 5 seconds for deployment to propagate
      await run("verify:verify", {
        address: vendor.address,
        contract: "contracts/Vendor.sol:Vendor",
        contractArguments: [vendor.address],
      });
    } catch (e) {
      console.log(" ⚠️ Failed to verify contract on Etherscan ");
    }
  }
};

module.exports.tags = ["Vendor"];
