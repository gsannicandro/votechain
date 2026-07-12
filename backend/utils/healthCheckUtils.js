import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

// Config constants
const RPC_TIMEOUT_MS = 3000;
const WEB_SERVICE_TIMEOUT_MS = 10000;

// Check RPC node connectivity
export async function checkRpcNode(url) {
  if (!url) return { status: 'skipped', message: 'Environment variable missing' };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'web3_clientVersion', params: [], id: 1 }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    return { status: 'connected', version: data.result, url: url };
  } catch (error) {
    return { status: 'disconnected', error: error.message, url: url };
  }
}

// Check contract artifact and on-chain code
export async function checkContract(providerUrl, filename) {
  if (!providerUrl) return { status: 'skipped', message: 'RPC not configured' };

  try {
    // Locate artifact
    const filePath = filename.includes('backend/constants')
      ? path.join(process.cwd(), filename)
      : path.join(process.cwd(), 'constants', filename);
    
    if (!fs.existsSync(filePath)) {
      return { status: 'skipped', message: 'Deployment not executed (JSON missing)' };
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const artifact = JSON.parse(fileContent);

    if (!artifact.address) {
      return { status: 'failed', message: 'Address missing in JSON' };
    }

    // Check on-chain code
    const provider = new ethers.JsonRpcProvider(providerUrl);

    // Timeout getCode
    const codePromise = provider.getCode(artifact.address);
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('RPC Timeout')), RPC_TIMEOUT_MS));
    
    const code = await Promise.race([codePromise, timeoutPromise]);

    if (code === '0x') {
      return { status: 'disconnected', error: 'Contract destroyed or non-existent', address: artifact.address };
    }

    return { 
      status: 'connected', 
      address: artifact.address, 
      message: 'Active & Deployed' 
    };

  } catch (error) {
    return { status: 'disconnected', error: error.message };
  }
}

// Check web service via GET
export async function checkWebService(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WEB_SERVICE_TIMEOUT_MS);

    const response = await fetch(url, { method: 'GET', signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.status >= 500) throw new Error(`Server Error: ${response.status}`);

    return { status: 'connected', url: url, message: response.status === 200 ? 'OK' : `Status: ${response.status}` };
  } catch (error) {
    return { status: 'disconnected', error: error.message, url: url };
  }
}
