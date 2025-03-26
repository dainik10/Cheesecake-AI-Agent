'use client';

import { useState } from 'react';
import type { HumanMessage } from '@langchain/core/messages';
import type { IterableReadableStream } from '@langchain/core/utils/stream';

export interface AgentType {
    stream: (params: {
        messages: HumanMessage[];
    }, config: AgentConfig) => Promise<IterableReadableStream<{
        agent?: { messages: { kwargs: { content: string } }[] };
        tools?: { messages: { kwargs: { content: string, error?: string } }[] };
    }>>;
}

export interface AgentConfig {
    configurable: {
        thread_id: string;
    };
}

interface Props {
    onInitialize: (agent: AgentType, config: AgentConfig) => void;
}

export default function AgentInitializer({ onInitialize }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInitialize = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/agent', { method: 'POST' });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            onInitialize(data.agent, data.config);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to initialize agent');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            {/* <h2 className="text-xl font-semibold mb-4 text-center text-gray-800">Initialize Agent</h2> */}

            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
                    {error}
                </div>
            )}

            <button
                type="button"
                onClick={handleInitialize}
                disabled={isLoading}
                className={`w-full py-2 px-4 rounded-md text-black ${isLoading
                        ? 'bg-yellow-400 cursor-not-allowed'
                        : 'bg-yellow-600 hover:bg-yellow-700'
                    }`}
            >
                {isLoading ? 'Initializing...' : 'Initialize Agent'}
            </button>
        </div>
    );
} 