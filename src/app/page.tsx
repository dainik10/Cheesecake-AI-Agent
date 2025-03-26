'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import ChatInterface from '../components/ChatInterface';
import Wallet from '../components/Wallet';
import type { AgentConfig } from '../components/AgentIntialize';
import Image from 'next/image';
import ErrorBoundary from '../components/ErrorBoundary';

export default function Home() {
    const [isWalletConnected, setIsWalletConnected] = useState(false);
    const [isAgentInitialized, setIsAgentInitialized] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [config, setConfig] = useState<AgentConfig | null>(null);
    const [privateKey, setPrivateKey] = useState<`0x${string}` | null>(null);
    const initErrorRef = useRef(false); // Track if we've already shown an error

    const initializeAgent = useCallback(async () => {
        if (!privateKey) return;
        if (initErrorRef.current) return; // Don't retry if we've already had an error

        try {
            setIsInitializing(true);
            const response = await fetch('/api/agent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ privateKey })
            });

            const data = await response.json();
            if (!data.success) throw new Error(data.error);

            setConfig(data.config);
            setIsAgentInitialized(true);
            toast.success('Agent initialized successfully!');
        } catch (error) {
            console.error('Agent initialization error:', error);
            // Only show the error once
            if (!initErrorRef.current) {
                toast.error(`Failed to initialize agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
                initErrorRef.current = true;
            }
            // Reset wallet connection to allow user to retry
            setIsWalletConnected(false);
        } finally {
            setIsInitializing(false);
        }
    }, [privateKey]);

    useEffect(() => {
        if (isWalletConnected && !isAgentInitialized && !isInitializing) {
            initializeAgent();
        }
    }, [isWalletConnected, isAgentInitialized, isInitializing, initializeAgent]);

    const handleWalletConnect = (_address: `0x${string}`, walletPrivateKey: `0x${string}`) => {
        console.log('Wallet Connected:', { address: _address });
        setPrivateKey(walletPrivateKey);
        setIsWalletConnected(true);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/60 p-4">
            <Toaster position="top-right" />
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-center items-center mb-8">
                    <Image src="/Cheesecake.png" alt="Cheesecake Logo" width={100} height={100} className="rounded-full w-16 h-16 mt-4" />
                    <h1 className="text-5xl font-bold text-center mb-8 text-white font-quantico shadow-lg tracking-tighter leading-tight mt-10">
                        Cheesecake Chat Interface
                    </h1>
                </div>

                {!isWalletConnected ? (
                    <Wallet onConnect={handleWalletConnect} />
                ) : !isAgentInitialized ? (
                    <div className="text-center p-4 bg-white rounded-lg shadow-md">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                        <p className="mt-2 text-gray-600">Initializing Agent...</p>
                    </div>
                ) : (
                    <ErrorBoundary>
                        <ChatInterface
                            config={config as AgentConfig}
                            privateKey={privateKey as `0x${string}`}
                        />
                    </ErrorBoundary>
                )}
            </div>
        </main>
    );
} 