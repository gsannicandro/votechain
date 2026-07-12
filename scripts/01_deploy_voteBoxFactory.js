const hre = require("hardhat");
const { saveDeploymentArtifacts } = require("./deployUtils");

// Blockchain chain_two: Vote Box Factory
// For deployment see README instructions in backend folder
const CONTRACT_NAME = "electionVoteBoxFactory";

// Main deployment function
async function main() {
  console.log(`Starting deployment to network: ${hre.network.name}`);

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  const ContractFactory = await hre.ethers.getContractFactory(CONTRACT_NAME);
  const constructorArgs = [deployer.address];

  // Deploy the contract
  const contract = await ContractFactory.deploy(...constructorArgs);
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`${CONTRACT_NAME} deployed at: ${contractAddress}`);

  // Save artifacts for frontend/backend
  await saveDeploymentArtifacts(contract, CONTRACT_NAME);

  return contract;
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = main;