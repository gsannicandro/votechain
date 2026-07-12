const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

// Centralized configuration
const ARTIFACTS_DIR = path.join(__dirname, "..", "backend", "constants");

// Saves the contract address and ABI to a JSON file accessible by the backend/frontend
async function saveDeploymentArtifacts(contract, name) {
  if (!fs.existsSync(ARTIFACTS_DIR)) {
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  }

  const address = await contract.getAddress();
  const artifact = await hre.artifacts.readArtifact(name);

  const data = {
    name: name,
    address: address,
    network: hre.network.name,
    chainId: Number(hre.network.config.chainId),
    deployedAt: new Date().toISOString(),
    abi: artifact.abi
  };

  const filePath = path.join(ARTIFACTS_DIR, `${name}.json`);
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Artifacts saved to: ${filePath}`);
}

module.exports = {
  saveDeploymentArtifacts
};
