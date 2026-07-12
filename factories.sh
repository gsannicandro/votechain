#!/bin/sh

echo "Starting contract deployment on the two Hardhat networks..."
sleep 10

echo "Starting deployment on Chain 1..."
docker exec hardhat-chain-1 npx hardhat run scripts/00_deploy_authFactory.js --network chain_one

echo "Starting deployment on Chain 2..."
docker exec hardhat-chain-2 npx hardhat run scripts/01_deploy_voteBoxFactory.js --network chain_two

echo "Deployment completed on both networks."