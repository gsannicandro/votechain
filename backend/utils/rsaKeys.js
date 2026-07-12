import NodeRSA from 'node-rsa';
import fs from 'fs';
import path from 'path';
import logger from './logger';

const KEYS_DIR = path.join(process.cwd(), 'keys');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'rsa_private.pem');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'rsa_public.pem');

// Ensure keys dir exists
if (!fs.existsSync(KEYS_DIR)) {
  fs.mkdirSync(KEYS_DIR, { recursive: true });
}

let keyPair;

function loadOrGenerateKeys() {
  if (keyPair) return keyPair;

  if (fs.existsSync(PRIVATE_KEY_PATH) && fs.existsSync(PUBLIC_KEY_PATH)) {
    try {
        const privateKeyData = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
        keyPair = new NodeRSA(privateKeyData);
    } catch (e) {
        logger.error('RSA', 'Failed to load existing keys. Regenerating.', e);
    }
  }
  
  if (!keyPair) {
    logger.info('RSA', "Generating new RSA keys...");
    keyPair = new NodeRSA({ b: 2048 });

    // Set private key perms 600
    fs.writeFileSync(PRIVATE_KEY_PATH, keyPair.exportKey('private'), { mode: 0o600 });
    fs.writeFileSync(PUBLIC_KEY_PATH, keyPair.exportKey('public'));
  }

  return keyPair;
}

export const getKeyPair = loadOrGenerateKeys;
export const getPublicKey = () => loadOrGenerateKeys().exportKey('public');
export const getPrivateKey = () => loadOrGenerateKeys().exportKey('private');

export const getPublicComponents = () => {
  const key = loadOrGenerateKeys();
  const components = key.exportKey('components-public');

  const toHex = (val) => {
    if (!val) return null;
    if (Buffer.isBuffer(val)) return val.toString('hex');
    if (typeof val === 'number') return val.toString(16);
    return val.toString();
  };

  return {
    N: toHex(components.n),
    E: toHex(components.e) || '10001'
  };
};