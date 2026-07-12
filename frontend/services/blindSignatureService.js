import NodeRSA from 'node-rsa';

// BigInt math utilities for blind signature
const bigIntMath = {
    // Modular exponentiation: (base^exp) % mod
    modPow(base, exp, mod) {
        let res = 1n;
        base = base % mod;
        while (exp > 0n) {
            if (exp % 2n === 1n) res = (res * base) % mod;
            base = (base * base) % mod;
            exp /= 2n;
        }
        return res;
    },

    // GCD
    gcd(a, b) {
        while (b !== 0n) {
            let t = b;
            b = a % b;
            a = t;
        }
        return a;
    },

    // Modular inverse: (a^-1) % m
    modInverse(a, m) {
        let m0 = m;
        let y = 0n;
        let x = 1n;
        if (m === 1n) return 0n;
        while (a > 1n) {
            let q = a / m;
            let t = m;
            m = a % m;
            a = t;
            t = y;
            y = x - q * y;
            x = t;
        }
        if (x < 0n) x += m0;
        return x;
    },

    // Secure random < mod and > 1
    secureRandom(mod) {
        const byteLen = Math.ceil(mod.toString(2).length / 8);
        const buf = new Uint8Array(byteLen);
        let num;
        do {
            window.crypto.getRandomValues(buf);
            let hex = '0x' + Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
            num = BigInt(hex);
        } while (num >= mod || num <= 1n); 
        return num;
    },

    // Convert text to BigInt
    textToBigInt(text) {
         let hex = '';
         for (let i = 0; i < text.length; i++) {
             hex += text.charCodeAt(i).toString(16);
         }
         return BigInt('0x' + hex);
    },
    
    // Convert BigInt to text (for debug)
    bigIntToText(bigInt) {
        let hex = bigInt.toString(16);
        if (hex.length % 2) hex = '0' + hex;
        let str = '';
        for (let i = 0; i < hex.length; i += 2) {
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        return str;
    }
};

const blindSignatureService = {
    blind(token, keyInput) {
        try {
            console.log("[BlindService] Inizio blinding. Token:", token);
            let n, e;

            if (typeof keyInput === 'object' && keyInput.N && keyInput.E) {
                const N_str = String(keyInput.N);
                const E_str = String(keyInput.E);
                n = N_str.startsWith('0x') ? BigInt(N_str) : BigInt('0x' + N_str);
                e = E_str.startsWith('0x') ? BigInt(E_str) : BigInt('0x' + E_str);
            } else {
                const key = new NodeRSA(keyInput);
                if (key.isEmpty()) throw new Error("Chiave RSA vuota o non valida");
                n = BigInt(key.keyPair.n.toString());
                e = BigInt(key.keyPair.e.toString());
            }

            // Convert message to number
            const m = bigIntMath.textToBigInt(token);
            if (m >= n) throw new Error("Il messaggio è troppo lungo per la chiave RSA");

            // Generate r (blinding factor) with gcd(r,n)=1
            let r;
            do {
                r = bigIntMath.secureRandom(n);
            } while (bigIntMath.gcd(r, n) !== 1n);

            const r_pow_e = bigIntMath.modPow(r, e, n);
            const blinded = (m * r_pow_e) % n;

            return {
                blinded: blinded.toString(),
                r: r.toString()
            };
        } catch (error) {
            console.error("Errore nel blinding:", error);
            throw new Error("Errore durante la cifratura del voucher: " + error.message);
        }
    },

    unblind(blindSignature, r, keyInput) {
        try {
            console.log("[BlindService] Inizio unblinding.");
            let n;
            if (typeof keyInput === 'object' && keyInput.N) {
                const N_str = String(keyInput.N);
                n = N_str.startsWith('0x') ? BigInt(N_str) : BigInt('0x' + N_str);
            } else {
                const key = new NodeRSA(keyInput);
                n = BigInt(key.keyPair.n.toString());
            }

            const s_prime = BigInt(blindSignature);
            const r_val = BigInt(r);

            const r_inv = bigIntMath.modInverse(r_val, n);

            const s = (s_prime * r_inv) % n;

            return s.toString();
        } catch (error) {
            console.error("Errore nell'unblinding:", error);
            throw new Error("Errore durante la decifratura della firma: " + error.message);
        }
    }
};

export default blindSignatureService;
