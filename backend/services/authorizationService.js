import { ethers } from 'ethers';
import { blindSignatureService } from './blindSignatureService';
import spentVoucherRepository from '../repositories/spentVoucherRepository';
import electionRepository from '../repositories/electionRepository';
import { authChainService } from './authChainService';
import logger from '../utils/logger';
import { ApiError } from '../lib/api-utils';

export const authorizationService = {

    async authorizeVote({ voucherSalt, unblindedSignature, walletAddress, electionId }) {
        const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;

        // Input validation
        if (!voucherSalt || !unblindedSignature || !walletAddress || !electionId) {
            throw new ApiError("Missing required parameters: voucherSalt, unblindedSignature, walletAddress, electionId", 400);
        }

        logger.info(logger.CONTEXTS.VOTE, "Processing authorization request", { electionId, walletAddressHash: ethers.keccak256(ethers.toUtf8Bytes(walletAddress)) });

        // Generate ECDSA signature configuration check
        if (!ADMIN_PRIVATE_KEY) {
            logger.error(logger.CONTEXTS.SYSTEM, "Server Misconfiguration: ADMIN_PRIVATE_KEY missing.");
            throw new ApiError("Internal Server Configuration Error.", 500);
        }

        // Election lock and date check
        const electionData = await electionRepository.getElectionById(electionId);
        if (!electionData) {
            throw new ApiError("Election not found.", 404);
        }
        
        const now = new Date();
        const endDate = new Date(electionData.end_date);

        if (now > endDate) {
            logger.warn(logger.CONTEXTS.VOTE, "Attempt to vote on EXPIRED election", { electionId });
            throw new ApiError("Election period has ended.", 403);
        }

        const contractAddress = electionData.vote_contract_address;
        const authContractAddress = electionData.auth_contract_address;

        if (!contractAddress || !ethers.isAddress(contractAddress)) {
            throw new ApiError("Election contract not deployed or invalid address.", 404);
        }
            
        // Check for Emergency Stop on Auth Contract
        if (authContractAddress && ethers.isAddress(authContractAddress) && authContractAddress !== ethers.ZeroAddress) {
                // Determine if election is locked via Smart Contract status
                const isLocked = await authChainService.isElectionLocked(authContractAddress);
                if (isLocked) {
                    logger.warn(logger.CONTEXTS.VOTE, "Attempt to vote on LOCKED election", { electionId });
                    throw new ApiError("Election is currently LOCKED (Emergency Stop Active).", 503);
                }
        }
        
        // Verify blind signature
        const isValidSignature = blindSignatureService.verifyToken(unblindedSignature, voucherSalt);
        if (!isValidSignature) {
            logger.warn(logger.CONTEXTS.VOTE, "Invalid Blind Signature detected", { walletAddress });
            throw new ApiError("Invalid Blind Signature.", 401);
        }

        // Double-spend check using signature hash
        const signatureHash = ethers.keccak256(ethers.toUtf8Bytes(unblindedSignature));

        // Check if voucher already spent
        const spentVoucher = await spentVoucherRepository.getSpentVoucher(signatureHash);
        if (spentVoucher) {
            logger.warn(logger.CONTEXTS.VOTE, "Double Spending attempt detected", { signatureHash });
            throw new ApiError("Voucher already used.", 409);
        }

        // Mark voucher spent
        await spentVoucherRepository.addSpentVoucher(signatureHash, electionId, walletAddress);

        const adminWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY);

        // Normalize voucherSalt to bytes32
        let saltBytes32;

        try {
            if (ethers.isHexString(voucherSalt)) {
                saltBytes32 = ethers.zeroPadValue(voucherSalt, 32);
            } else if (/^\d+$/.test(voucherSalt)) {
                const bn = BigInt(voucherSalt);
                saltBytes32 = ethers.zeroPadValue(ethers.toBeHex(bn), 32);
            } else {
                saltBytes32 = ethers.keccak256(ethers.toUtf8Bytes(voucherSalt));
            }
        } catch (error) {
            logger.warn("Error converting voucherSalt, falling back to hash", { error: error.message });
            saltBytes32 = ethers.keccak256(ethers.toUtf8Bytes(String(voucherSalt)));
        }

        // Build payload hash (address,address,bytes32)
        const payloadHash = ethers.solidityPackedKeccak256(
            ['address', 'address', 'bytes32'],
            [walletAddress, contractAddress, saltBytes32]
        );

        // Sign message
        const signature = await adminWallet.signMessage(ethers.getBytes(payloadHash));

        return signature;
    }
};
