// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "./authRegistry.sol";

contract electionAuthFactory is Ownable {
    // Map election ID -> authRegistry address
    mapping(uint256 => address) public authRegistries;
    // Deployed election IDs
    uint256[] public allElectionIds;

    constructor(address initialOwner) Ownable(initialOwner) {}

    // New registry event
    event authRegistryCreated(
        address indexed registryAddress,
        uint256 indexed electionId,
        uint256 timestamp
    );

    function createAuthRegistryContract(
        uint256 id,
        bytes32 merkleRoot,
        uint256 timeStart,
        uint256 timeEnd,
        bytes32  electionMetadata
    ) external onlyOwner returns (address) {
        // Validate input
        require(authRegistries[id] == address(0), "Election ID already exists");
        require(timeEnd > timeStart, "End time must be > Start time");
        require(timeEnd > block.timestamp, "End time must be in the future");

        authRegistry newRegistry = new authRegistry(
            msg.sender,
            merkleRoot,
            timeStart,
            timeEnd,
            electionMetadata
        );

        // Store and emit
        authRegistries[id] = address(newRegistry);
        allElectionIds.push(id);

        emit authRegistryCreated(address(newRegistry), id, block.timestamp);

        return address(newRegistry);
    }

    // Get deployed IDs
    function getDeployedElections() external view returns (uint256[] memory) {
        return allElectionIds;
    }
}
