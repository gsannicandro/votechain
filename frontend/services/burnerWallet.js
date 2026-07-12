import { ethers } from 'ethers';

const CONFIG = {
  STORAGE_KEY: 'votechain_burner_wallet',
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  RPC_URL: process.env.NEXT_PUBLIC_VOTE_RPC_URL || 'http://localhost:8546',
  USE_GASLESS: process.env.NEXT_PUBLIC_USE_GASLESS === 'true' || true,
};

const VOTE_BOX_ABI = [
  "function castVote(bytes16 _candidateId, bytes32 _voucherSalt, bytes calldata _signature) external"
];

export const burnerWalletService = {
  
  // Generates a new Burner Wallet and saves it to Session Storage.
  // If one already exists, it returns the existing one.
  createOrGetWallet() {
    if (typeof window === 'undefined') return null;

    const storedKey = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (storedKey) {
      return new ethers.Wallet(storedKey);
    }

    const wallet = ethers.Wallet.createRandom();
    localStorage.setItem(CONFIG.STORAGE_KEY, wallet.privateKey);
    return wallet;
  },

  // Retrieves the current wallet if it exists.
  getWallet() {
    if (typeof window === 'undefined') return null;
    const storedKey = localStorage.getItem(CONFIG.STORAGE_KEY);
    return storedKey ? new ethers.Wallet(storedKey) : null;
  },

  // Destroys the wallet keys from local storage.
  destroyWallet() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CONFIG.STORAGE_KEY);
    }
  },

  async requestGasAndVotingRights(voucherSalt, unblindedSignature, electionId) {
    const wallet = this.getWallet();
    if (!wallet) throw new Error("Burner wallet not found. Generate one first.");

    try {
      const response = await fetch(`${CONFIG.API_URL}/api/vote/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: wallet.address,
          voucherSalt,
          unblindedSignature,
          electionId
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        const error = new Error(payload.message || 'Error requesting Faucet');
        error.status = response.status;
        throw error;
      }

      return payload;
    } catch (error) {
      console.error("Faucet Service Error:", error);
      throw error;
    }
  },

  async castVote(contractAddress, candidateId, voucherSalt, votingSignature, rpcUrl) {
    const wallet = this.getWallet();
    if (!wallet) throw new Error("Burner wallet not found.");

    if (!contractAddress || !ethers.isAddress(contractAddress)) {
      throw new Error("Invalid contract address.");
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl || CONFIG.RPC_URL);
    const connectedWallet = wallet.connect(provider);
    const contract = new ethers.Contract(contractAddress, VOTE_BOX_ABI, connectedWallet);

    try {
      console.log(`Voting for ${candidateId} on contract ${contractAddress}`);

      const txOptions = CONFIG.USE_GASLESS ? { gasPrice: 0 } : {};

      const formattedSalt = (ethers.isHexString(voucherSalt) && voucherSalt.length === 66)
        ? voucherSalt
        : ethers.keccak256(ethers.toUtf8Bytes(voucherSalt));

      let formattedCandidateId = candidateId;
      if (typeof candidateId === 'string') {
          if (candidateId.length === 36 && candidateId.includes('-')) {
              formattedCandidateId = '0x' + candidateId.replace(/-/g, '');
          } 
          else if (/^[0-9a-fA-F]{32}$/.test(candidateId)) {
              formattedCandidateId = '0x' + candidateId;
          }
          else if (/^[0-9a-fA-F]{32}$/.test(candidateId)) {
              formattedCandidateId = '0x' + candidateId;
          }
      }

      console.log(`[BurnerWallet] Voting for ${formattedCandidateId} (Original: ${candidateId})`);

      const tx = await contract.castVote(formattedCandidateId, formattedSalt, votingSignature, txOptions);
      console.log("Transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      const voteReceipt = this._extractVoteReceipt(receipt, wallet.address);
      
      return {
        ...receipt,
        voteReceipt
      };

    } catch (error) {
      console.error("Voting Transaction Error:", error);
      
      if (error.reason) {
        throw new Error(`Smart Contract Error: ${error.reason}`);
      } else if (error.data) {
        throw new Error(`Blockchain Error: ${error.data}`);
      }
      
      throw new Error("Unable to complete vote. Check connection or election status.");
    }
  },

  
  _extractVoteReceipt(receipt, walletAddress) {
    const voteCastLog = receipt.logs.find(log => {
      return log.topics && log.topics.length > 0;
    });

    if (!voteCastLog) {
      console.warn("VoteCast event not found in transaction logs");
      return null;
    }

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      logIndex: voteCastLog.index,
      walletAddress: walletAddress,
      timestamp: Date.now()
    };
  }
};
