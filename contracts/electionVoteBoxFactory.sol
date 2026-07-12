// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "./voteBoxRegistry.sol";

contract electionVoteBoxFactory is Ownable {
    // Map election ID -> voteBoxRegistry address
    mapping(uint256 => address) public voteBoxRegistries;
    // Deployed election IDs
    uint256[] public allElectionIds;

    constructor(address initialOwner) Ownable(initialOwner) {}

    // New registry event
    event voteBoxRegistryCreated(
        address indexed registryAddress,
        uint256 indexed electionId,
        uint256 timestamp
    );

    function createVoteBoxRegistryContract(
        uint256 id,
        uint256 timeStart,
        uint256 timeEnd,
        bytes32 electionMetadata,
        bytes16[] calldata candidateIDs
    ) external onlyOwner returns (address) {
        // Validate input
        require(voteBoxRegistries[id] == address(0), "Election ID already exists");
        require(timeEnd > timeStart, "End time must be > Start time");
        require(timeEnd > block.timestamp, "End time must be in the future");

        // Deploy voteBoxRegistry
        voteBoxRegistry newRegistry = new voteBoxRegistry(
            msg.sender, // Owner (Backend)
            timeStart,
            timeEnd,
            electionMetadata,
            candidateIDs
        );

        // Store and emit
        voteBoxRegistries[id] = address(newRegistry);
        allElectionIds.push(id);

        emit voteBoxRegistryCreated(address(newRegistry), id, block.timestamp);

        return address(newRegistry);
    }

    // Get voteBoxRegistry by election ID
    function getVoteBoxAddress(uint256 id) external view returns (address) {
        return voteBoxRegistries[id];
    }

    // Get deployed IDs
    function getDeployedElections() external view returns (uint256[] memory) {
        return allElectionIds;
    }
}
