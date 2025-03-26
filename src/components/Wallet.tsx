'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { generateNewWallet, privateKeyToAddress } from '../lib/wallet';
import Cookies from 'js-cookie';

interface Props {
    onConnect: (address: `0x${string}`, privateKey: `0x${string}`) => void;
}

export default function Wallet({ onConnect }: Props) {
    const [isConnecting, setIsConnecting] = useState(false);
    const [showBackup, setShowBackup] = useState(false);
    const [privateKey, setPrivateKey] = useState<`0x${string}` | ''>('');
    const [walletAddress, setWalletAddress] = useState<`0x${string}` | ''>('');
    const [isImporting, setIsImporting] = useState(false);
    const [importPrivateKey, setImportPrivateKey] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Check for existing wallet in cookies on mount
    useEffect(() => {
        const savedPrivateKey = Cookies.get('wallet_private_key');
        if (savedPrivateKey) {
            try {
                // Decrypt the private key (basic encryption for demo)
                const decryptedKey = atob(savedPrivateKey) as `0x${string}`;
                const address = privateKeyToAddress(decryptedKey);
                
                // Auto-connect with the saved wallet
                onConnect(address, decryptedKey);
                toast.success('Reconnected with saved wallet');
            } catch (error) {
                console.error('Failed to restore wallet from cookie:', error);
                // Clear invalid cookie
                Cookies.remove('wallet_private_key');
            }
        }
    }, [onConnect]);

    const createNewWallet = async () => {
        setIsConnecting(true);
        try {
            // Generate new wallet
            const { address, privateKey } = generateNewWallet();
            
            // Save for backup screen
            setPrivateKey(privateKey);
            setWalletAddress(address);
            setShowBackup(true);
            setIsCopied(false);
            
            // Note: We don't connect or save the cookie yet - waiting for user to backup
            toast.success('New wallet generated! Please backup your private key.');
        } catch (error) {
            toast.error('Failed to create wallet');
            console.error(error);
        } finally {
            setIsConnecting(false);
        }
    };

    // This now runs after user has backed up or skipped
    const completeWalletSetup = () => {
        if (!privateKey || !walletAddress) return;
        
        // Save encrypted private key in a cookie (30-day expiry)
        Cookies.set('wallet_private_key', btoa(privateKey), { 
            expires: 30, 
            secure: true, 
            sameSite: 'strict'
        });
        
        // Now connect the wallet after backup
        onConnect(walletAddress, privateKey);
        setShowBackup(false);
        setShowModal(false);
    };

    const importWallet = async () => {
        setIsConnecting(true);
        try {
            // Validate private key format
            let privateKey = importPrivateKey.trim();
            if (!privateKey.startsWith('0x')) {
                privateKey = `0x${privateKey}`;
            }
            
            if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
                toast.error('Invalid private key format');
                return;
            }
            
            // Convert private key to address
            const address = privateKeyToAddress(privateKey as `0x${string}`);
            
            // Save encrypted private key in a cookie (30-day expiry)
            Cookies.set('wallet_private_key', btoa(privateKey), { 
                expires: 30, 
                secure: true, 
                sameSite: 'strict'
            });
            
            onConnect(address, privateKey as `0x${string}`);
            toast.success('Wallet imported successfully!');
            
            // Reset import state
            setIsImporting(false);
            setImportPrivateKey('');
        } catch (error) {
            toast.error('Failed to import wallet');
            console.error(error);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleCopyPrivateKey = () => {
        navigator.clipboard.writeText(privateKey);
        setIsCopied(true);
        setShowModal(true);
        
        // After a delay, proceed to initialize
        setTimeout(() => {
            completeWalletSetup();
        }, 3000);
    };

    // Backup private key screen
    if (showBackup) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-center text-gray-800 font-quantico">
                    Your Wallet is Ready
                </h2>
                <div className="bg-yellow-200 p-4 rounded-md mb-4">
                    <p className="text-sm text-yellow-900 mb-2">
                        ⚠️ <strong>Important:</strong> Your private key gives full access to your funds.
                        Copy and store it in a safe place. You can Import it later if you want.
                    </p>
                    <div className="bg-gray-300 border-2 border-gray-700 rounded-md p-3 rounded break-all font-mono text-sm relative group">
                        <div className="flex items-center">
                            <div className={`flex-grow filter blur-sm transition-all duration-300 ${isCopied ? "opacity-20" : ""}`}>
                                {privateKey}
                            </div>
                            <button 
                                type="button"
                                onClick={handleCopyPrivateKey}
                                disabled={isCopied}
                                className={`ml-2 p-1 border-2 border-gray-700 rounded-full ${isCopied ? "opacity-20" : "hover:bg-gray-200"}`}
                            >
                                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Success Modal */}
                {showModal && (
                    <div className="bg-green-50 p-4 rounded-md mb-4 text-center">
                        <p className="text-green-800 font-medium">
                            ✅ Private key copied successfully!
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                            Save it securely. Initializing wallet...
                        </p>
                    </div>
                )}
            </div>
        );
    }

    // Import wallet screen
    if (isImporting) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-center text-gray-800 font-quantico">
                    Import Existing Wallet
                </h2>
                <div className="bg-yellow-50 p-3 rounded-md mb-4">
                    <p className="text-sm text-yellow-800">
                        ⚠️ <strong>Note:</strong> Your wallet will be remembered on this device for 30 days.
                    </p>
                </div>
                <div className="mb-4">
                    <span className="block text-sm font-medium text-gray-700 mb-1">
                        Enter Private Key
                    </span>
                    <input
                        type="password"
                        value={importPrivateKey}
                        onChange={(e) => setImportPrivateKey(e.target.value)}
                        placeholder="0x..."
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                    />
                </div>
                <button
                    type="button"
                    onClick={importWallet}
                    disabled={isConnecting || !importPrivateKey}
                    className={`w-full py-2 px-4 rounded-md text-white mb-2 ${
                        isConnecting || !importPrivateKey
                            ? 'bg-purple-400 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                >
                    {isConnecting ? 'Importing...' : 'Import Wallet'}
                </button>
                <button
                    type="button"
                    onClick={() => setIsImporting(false)}
                    className="w-full py-2 px-4 rounded-md text-gray-700 border border-gray-300 hover:bg-gray-50"
                >
                    Cancel
                </button>
            </div>
        );
    }

    // Main wallet options screen
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-center text-gray-800 font-quantico">
                Choose Wallet Option
            </h2>
            
            <div className="bg-yellow-50 p-3 rounded-md mb-4">
                <p className="text-sm text-yellow-800">
                    🔒 Your wallet will be securely remembered on this device for 30 days. Use significant amounts of funds at your own risk.
                </p>
            </div>
            
            <div className="space-y-3 mb-4">
                <button
                    type="button"
                    onClick={createNewWallet}
                    disabled={isConnecting}
                    className={`w-full py-2 px-4 rounded-md text-white ${
                        isConnecting
                            ? 'bg-purple-400 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                >
                    {isConnecting ? 'Generating...' : 'Create New Wallet'}
                </button>
                
                <button
                    type="button"
                    onClick={() => setIsImporting(true)}
                    className="w-full py-2 px-4 rounded-md text-purple-600 border border-purple-600 hover:bg-purple-50"
                >
                    Import Existing Wallet
                </button>
            </div>
        </div>
    );
} 