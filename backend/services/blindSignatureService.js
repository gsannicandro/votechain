import { ethers } from 'ethers';
import BlindSignature from 'blind-signatures';
import { getKeyPair, getPublicComponents } from '../utils/rsaKeys';
import { authChainService } from './authChainService';
import electionRepository from '../repositories/electionRepository';
import whitelistRepository from '../repositories/whitelistRepository';
import { BigInteger } from 'jsbn';
import { ApiError } from '../lib/api-utils';
import logger from '../utils/logger';

export const blindSignatureService = {

  // Process blind signature request and register user
  async processBlindSignatureRequest(userEmail, blindedMessage, electionId) {
    // Validate input
    if (!userEmail || !blindedMessage || !electionId) {
      throw new ApiError("Missing required parameters: userEmail, blindedMessage, electionId", 400);
    }

    // Check whitelist eligibility
    const isEligible = await whitelistRepository.checkEligibility(userEmail, electionId);
    if (!isEligible) {
      throw new ApiError("User is not eligible (not in whitelist, already voted, or election closed).", 403);
    }

    // Get election contracts
    const contracts = await electionRepository.getElectionContracts(electionId);
    if (!contracts || !contracts.auth_contract_address) {
      throw new ApiError("Election contract not found or not deployed", 404);
    }
    const authContractAddress = contracts.auth_contract_address;

    // Blockchain check to avoid double spending
    const userIdentity = ethers.keccak256(ethers.toUtf8Bytes(userEmail));

    // This call might throw ApiError (e.g. 503 or 502), allow it to bubble up
    const hasClaimed = await authChainService.hasUserClaimed(authContractAddress, userIdentity);
    if (hasClaimed) {
        throw new ApiError("User has already claimed a voting voucher (Blockchain check).", 409);
    }

    // Sign blinded message (RSA)
    let signature;
    try {
        const keyPair = getKeyPair();
        const { n, e, d } = keyPair.exportKey('components');

        // Convert keys to jsbn BigInteger
        const nBi = new BigInteger(n.toString('hex'), 16);
        const dBi = new BigInteger(d.toString('hex'), 16);
        const eVal = e.toString();

        signature = BlindSignature.sign({
        blinded: blindedMessage,
        key: {
            keyPair: {
            n: nBi,
            d: dBi,
            e: eVal
            }
        }
        });
    } catch (error) {
        logger.error('BlindSignatureService', 'RSA Signing failed', error);
        throw new ApiError('Failed to generate blind signature.', 500);
    }

    // Register user on auth chain
    let txId = null;
    try {
        const proof = await electionRepository.getMerkleProof(userEmail, electionId);

        if (!proof || proof.length === 0) {
            throw new ApiError("Merkle Proof not found for user.", 404);
        }

        const tx = await authChainService.registerUserOnChain(authContractAddress, userIdentity, proof);
        txId = tx.hash;
    } catch (error) {
        // If it's already an ApiError, rethrow it (e.g. locked election)
        if (error instanceof ApiError) throw error;
        
        logger.error('BlindSignatureService', "Blockchain registration failed", error);
        throw new ApiError("Failed to register user on blockchain. Signature withheld.", 502);
    }

    // Persist registration in DB (best-effort)
    try {
      const blindedTokenHash = ethers.keccak256(ethers.toUtf8Bytes(blindedMessage));
      await whitelistRepository.markAsRegistered(userEmail, electionId, txId, blindedTokenHash, signature.toString());
    } catch (dbError) {
      logger.error('BlindSignatureService', "Database persistence failed after blockchain registration", dbError);
    }

    // Return RSA signature
    return signature.toString();
  },

  // Verify unblinded RSA signature matches message
  verifyToken(unblindedSignature, voucherSalt) {
    try {
        const keyPair = getKeyPair();
        const { n, e } = keyPair.exportKey('components');

        // Convert voucherSalt to BigInteger (numeric or ASCII)
        let messageBigInt;
        if (/^\d+$/.test(voucherSalt)) {
        messageBigInt = new BigInteger(voucherSalt);
        } else {
        let hex = '';
        for (let i = 0; i < voucherSalt.length; i++) {
            hex += voucherSalt.charCodeAt(i).toString(16);
        }
        messageBigInt = new BigInteger(hex, 16);
        }

        const nBi = new BigInteger(n.toString('hex'), 16);
        const eBi = new BigInteger(e.toString(), 10);
        const sBi = new BigInteger(unblindedSignature);

        // RSA verify: s^e mod n == m
        const isValid = sBi.modPow(eBi, nBi).equals(messageBigInt);

        return isValid;
    } catch (error) {
        logger.error('BlindSignatureService', 'Token verification failed', error);
        return false;
    }
  },

  getPublicKey() {
    const { N, E } = getPublicComponents();
    return {
      n: N,
      e: E
    };
  }
};

export default blindSignatureService;