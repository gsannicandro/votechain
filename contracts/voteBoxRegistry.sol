// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract voteBoxRegistry is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // Errors
    error ElectionLocked();
    error VotingClosed();
    error InvalidCandidate();
    error VoucherAlreadyUsed();
    error InvalidSignature();
    error VotingAlreadyStarted();
    error InvalidTimeWindow();

    // Blank vote constant
    bytes16 public constant BLANK_CANDIDATE_ID = bytes16(0);

    address public immutable adminAddress;
    bytes32 public electionMetadata;
    uint256 public timeStart;
    uint256 public timeEnd;
    bytes16[] public candidateIDs;
    bool public isLocked;
    
    mapping(bytes32 => bool) public voucherSpent;
    mapping(bytes16 => bool) public isValidCandidate;

    event VoteCast(bytes16 indexed candidateId); 
    
    event ElectionMetadataUpdated(bytes32 newMetadata);
    event CandidatesUpdated(uint256 timestamp);
    event TimeWindowUpdated(uint256 newStart, uint256 newEnd);
    event EmergencyLockActivated(uint256 timestamp);
    event EmergencyLockDeactivated(uint256 timestamp);

    constructor(
        address initialOwner,
        uint256 _startTime,
        uint256 _endTime,
        bytes32 _electionMetadata,
        bytes16[] memory _candidatesIDs
    ) Ownable(initialOwner) {
        timeStart = _startTime;
        timeEnd = _endTime;
        electionMetadata = _electionMetadata;
        isLocked = false;
        candidateIDs = _candidatesIDs;
        adminAddress = initialOwner;


        for (uint i = 0; i < _candidatesIDs.length; i++) {
            isValidCandidate[_candidatesIDs[i]] = true;
        }

        // Add blank vote
        isValidCandidate[BLANK_CANDIDATE_ID] = true;
        candidateIDs.push(BLANK_CANDIDATE_ID);
    }

    // Cast vote with voucher
    function castVote(
        bytes16 _candidateId, 
        bytes32 _voucherSalt, 
        bytes calldata _signature
    ) external {
        if (isLocked) revert ElectionLocked();
        if (block.timestamp < timeStart || block.timestamp > timeEnd) revert VotingClosed();
        if (!isValidCandidate[_candidateId]) revert InvalidCandidate();
        if (voucherSpent[_voucherSalt]) revert VoucherAlreadyUsed();

        // Build message hash (sender + contract + salt)
        // Prevent cross-election replay
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, address(this), _voucherSalt));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        
        address signer = ethSignedMessageHash.recover(_signature);
        if (signer != adminAddress) revert InvalidSignature();

        // Mark voucher used
        voucherSpent[_voucherSalt] = true;
        
        emit VoteCast(_candidateId);
    }

    // Update start time (before start)
    function updateStartTime(uint256 newStartTime) external onlyOwner {
        if (block.timestamp >= timeStart) revert VotingAlreadyStarted();
        if (newStartTime >= timeEnd) revert InvalidTimeWindow();
        
        timeStart = newStartTime;
        emit TimeWindowUpdated(newStartTime, timeEnd);
    }

    // Update end time
    function updateEndTime(uint256 newEndTime) external onlyOwner {
        if (block.timestamp >= timeStart) revert VotingAlreadyStarted();
        if (newEndTime <= timeStart) revert InvalidTimeWindow();
        
        timeEnd = newEndTime;
        emit TimeWindowUpdated(timeStart, newEndTime);
    }

    // Update metadata
    function updateElectionMetadata(bytes32 newMetadata) external onlyOwner {
        if (block.timestamp >= timeStart) revert VotingAlreadyStarted();
        electionMetadata = newMetadata;
        emit ElectionMetadataUpdated(newMetadata);
    }

    // Update candidates (before start)
    function updateCandidates(bytes16[] calldata _newCandidateIDs) external onlyOwner {
        if (block.timestamp >= timeStart) revert VotingAlreadyStarted();

        // Invalidate old candidates
        for (uint i = 0; i < candidateIDs.length; i++) {
            if (candidateIDs[i] != BLANK_CANDIDATE_ID) {
                isValidCandidate[candidateIDs[i]] = false;
            }
        }

        // Set new candidates
        candidateIDs = _newCandidateIDs;

        bool blankFound = false;
        // Validate candidates
        for (uint i = 0; i < _newCandidateIDs.length; i++) {
            isValidCandidate[_newCandidateIDs[i]] = true;
            if (_newCandidateIDs[i] == BLANK_CANDIDATE_ID) {
                blankFound = true;
            }
        }

        // Ensure blank vote present
        if (!blankFound) {
            candidateIDs.push(BLANK_CANDIDATE_ID);
            isValidCandidate[BLANK_CANDIDATE_ID] = true;
        }

        emit CandidatesUpdated(block.timestamp);
    }

    // Get election info
    function getElectionInfo()
        external
        view
        returns (bytes32, uint256, uint256, bool)
    {
        bool isOpen = (block.timestamp >= timeStart &&
            block.timestamp <= timeEnd);
        return (
            electionMetadata,
            timeStart,
            timeEnd,
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