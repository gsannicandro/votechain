import BlindSignature from 'blind-signatures';
import { keccak256, toUtf8Bytes, isHexString } from 'ethers';

export const blindSignatureUtils = {
  blindMessage(message, N_hex, E_hex) {
    if (!message) {
      throw new Error("blindMessage: Message is required.");
    }
    if (!N_hex || !E_hex) {
      throw new Error("blindMessage: Public Key (N, E) is missing.");
    }

    try {
      // Helper to ensure Hex has 0x prefix
      const toHex = (val) => (typeof val === 'string' && !val.startsWith('0x') ? '0x' + val : val);

      // Prepare Message Hash
      const messageHash = isHexString(message) ? message : keccak256(toUtf8Bytes(message));

      // Convert Keys to Strings (Decimal representation for blind-signatures lib)
      const N = BigInt(toHex(N_hex)).toString();
      const E = BigInt(toHex(E_hex)).toString();
      
      // Generate Blinding Factor (r)
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      const rHex = '0x' + Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      const r = BigInt(rHex).toString();

      console.log('BlindSignature Debug:', {
        messageHash,
        N,
        E,
        r,
        BlindSignatureType: typeof BlindSignature,
        BlindSignatureKeys: Object.keys(BlindSignature || {})
      });

      const blinded = BlindSignature.blind({
        message: messageHash,
        key: { n: N, e: E },
        r: r
      });

      return {
        blinded: blinded.toString(),
        r: rHex
      };
    } catch (error) {
      throw new Error(`blindMessage failed: ${error.message}`);
    }
  },

  unblindSignature(blindedSignature, r_hex, N_hex) {
    if (!blindedSignature || !r_hex || !N_hex) {
      throw new Error("unblindSignature: Missing required arguments (signature, r, or N).");
    }

    try {
      const toHex = (val) => (typeof val === 'string' && !val.startsWith('0x') ? '0x' + val : val);

      const signed = BigInt(toHex(blindedSignature)).toString();
      const r = BigInt(toHex(r_hex)).toString();
      const N = BigInt(toHex(N_hex)).toString();

      const unblinded = BlindSignature.unblind({
        signed: signed,
        r: r,
        N: N
      });

      // Convert result to Hex string
      return '0x' + BigInt(unblinded).toString(16);
    } catch (error) {
      throw new Error(`unblindSignature failed: ${error.message}`);
    }
  }
};
