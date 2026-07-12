// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "node_modules/@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract authRegistry is Ownable {
    // Errors
    error RegistrationNotActive();
    error UserAlreadyRegistered();
    error InvalidTimeWindow();
    error RegistrationAlreadyStarted();
    error RegistrationsActive();
    
    bytes32 public electionMetadata;
    bytes32 public merkleRoot;
    uint256 public timeStart;
    uint256 public timeEnd;
    uint256 public totalRegisteredUsers;
    bool public isLocked;

    mapping(bytes32 => bool) public hasClaimed;

    event UserRegistered(bytes32 indexed user, uint256 timestamp);
    event MerkleRootUpdated(bytes32 newRoot);
    event ElectionMetadataUpdated(bytes32 newMetadata);
    event TimeWindowUpdated(uint256 newStart, uint256 newEnd);
    event EmergencyLockActivated(uint256 timestamp);
    event EmergencyLockDeactivated(uint256 timestamp);

    constructor(
        address initialOwner,
        bytes32 _merkleRoot,
        uint256 _timeStart,
        uint256 _timeEnd,
        bytes32 _electionMetadata
    ) Ownable(initialOwner) {
        merkleRoot = _merkleRoot;
        timeStart = _timeStart;
        timeEnd = _timeEnd;
        electionMetadata = _electionMetadata;
        isLocked = false;
    }

    // Register user if eligible
    function registerUser(
        bytes32[] calldata proof,
        bytes32 account
    ) external onlyOwner {
        if (block.timestamp < timeStart || block.timestamp > timeEnd || isLocked) {
            revert RegistrationNotActive();
        }
        if (!isEligible(proof, account)) {
            revert UserAlreadyRegistered();
        }

        hasClaimed[account] = true;
        totalRegisteredUsers++;

        emit UserRegistered(account, block.timestamp);
    }

    // Check eligibility
    function isEligible (
        bytes32[] calldata proof,
        bytes32 account
    ) public view returns (bool) {
        if (hasClaimed[account]) return false; // Already registered

        bytes32 leaf = keccak256(abi.encodePacked(account));
        return MerkleProof.verify(proof, merkleRoot, leaf);
    }

    // Update end time
    function updateEndTime(uint256 newEndTime) external onlyOwner {
        if (block.timestamp >= timeStart) {
             revert RegistrationAlreadyStarted();
        }
        if (newEndTime <= timeStart) {
            revert InvalidTimeWindow();
        }
        timeEnd = newEndTime;
        emit TimeWindowUpdated(timeStart, newEndTime);
    }

    // Update merkle root (only if none registered)
    function updateMerkleRoot(bytes32 newRoot) external onlyOwner {
        if (totalRegisteredUsers > 0) {
            revert RegistrationsActive();
        }
        if (block.timestamp >= timeStart) {
            revert RegistrationAlreadyStarted();
        }
        merkleRoot = newRoot;
        emit MerkleRootUpdated(newRoot);
    }

    // Update metadata
    function updateElectionMetadata(bytes32 newMetadata) external onlyOwner {
        if (block.timestamp >= timeStart) revert RegistrationAlreadyStarted();
        electionMetadata = newMetadata;
        emit ElectionMetadataUpdated(newMetadata);
    }

    // Update start time (before start)
    function updateStartTime(uint256 newStartTime) external onlyOwner {
        if (block.timestamp >= timeStart) {
            revert RegistrationAlreadyStarted();
        }
        if (newStartTime >= timeEnd) {
            revert InvalidTimeWindow();
        }
        timeStart = newStartTime;
        emit TimeWindowUpdated(newStartTime, timeEnd);
    }

    // Batch registration status
    function checkUserRegistered(
        bytes32[] calldata accounts
    ) external view returns (bool[] memory) {
        bool[] memory registrationStatuses = new bool[](accounts.length);
        for (uint256 i = 0; i < accounts.length; i++) {
            registrationStatuses[i] = hasClaimed[accounts[i]];
        }
        return registrationStatuses;
    }

    // Get election info
    function getElectionInfo()
        external
        view
        returns (bytes32, bytes32, uint256, uint256, uint256, bool)
    {
        bool isOpen = (block.timestamp >= timeStart &&
            block.timestamp <= timeEnd);
        return (
            electionMetadata,
            merkleRoot,
            timeStart,
            timeEnd,
            totalRegisteredUsers,
            isOpen
        );
    }

    // Emergency lock
    function emergencyLock() external onlyOwner {
        isLocked = true;
        emit EmergencyLockActivated(block.timestamp);
    }

    function unlock() external onlyOwner {
        isLocked = false;
        emit EmergencyLockDeactivated(block.timestamp);
    }
}