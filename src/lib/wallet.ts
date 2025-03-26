import type { Address } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

interface WalletDetails {
    privateKey: `0x${string}`;
    address: Address;
}

export function generateNewWallet(): WalletDetails {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    
    return {
        address: account.address,
        privateKey: privateKey
    };
}

export function privateKeyToAddress(privateKey: `0x${string}`): `0x${string}` {
    try {
        const account = privateKeyToAccount(privateKey);
        return account.address;
    } catch (error) {
        console.error('Invalid private key:', error);
        throw new Error('Failed to derive address from private key');
    }
} 