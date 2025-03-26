import 'server-only'; // Ensure this code only runs on server
import { Agentkit, AgentkitToolkit } from "@0xgasless/agentkit";
import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import type { StructuredTool } from '@langchain/core/tools';

// Server-side agent store
const agentInstances = new Map();

export async function getOrCreateAgent(privateKey: `0x${string}`) {
    // Check if we already have an instance
    if (agentInstances.has(privateKey)) {
        return agentInstances.get(privateKey);
    }

    // Create new agent instance
    const instance = await createAgentInstance(privateKey);
    agentInstances.set(privateKey, instance);
    return instance;
}

async function createAgentInstance(privateKey: `0x${string}`) {
    try {
        const llm = new ChatOpenAI({
            model: "openai/gpt-4o",
            openAIApiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY,
            configuration: {
                baseURL: "https://openrouter.ai/api/v1",
            },
        });

        // Configure agent with wallet entirely server-side
        const agentkit = await Agentkit.configureWithWallet({
            privateKey,
            rpcUrl: process.env.NEXT_PUBLIC_RPC_URL as string,
            apiKey: process.env.NEXT_PUBLIC_API_KEY as string,
            chainID: Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 56,
        });

        const toolkit = new AgentkitToolkit(agentkit);
        const tools = toolkit.getTools();

        // Log details about each tool
        // for (const tool of tools) {
        //     console.log(`Tool registered: ${tool.name}`);
            
        //     // For all transaction-related tools
        //     if (['swap_tokens', 'transfer_tokens', 'send_transaction'].includes(tool.name)) {
        //         const originalCall = tool.call.bind(tool);
        //         tool.call = async (...args) => {
        //             console.log(`${tool.name.toUpperCase()} CALLED WITH ARGS:`, JSON.stringify(args, null, 2));
        //             try {
        //                 const result = await originalCall(...args);
        //                 console.log(`${tool.name.toUpperCase()} RESULT:`, JSON.stringify(result, null, 2));
                        
        //                 // Add operation hash info to the result if it exists
        //                 if (result && typeof result === 'object' && 'opHash' in result) {
        //                     return {
        //                         ...result,
        //                         content: `Transaction submitted! User Operation Hash: ${result.opHash}\n\nThis operation will be bundled and executed on BSC. You can track this transaction on the BSC explorer once it's confirmed.`
        //                     };
        //                 }
                        
        //                 return result;
        //             } catch (error) {
        //                 console.error(`${tool.name.toUpperCase()} ERROR DETAILS:`, {
        //                     error,
        //                     message: error instanceof Error ? error.message : "Unknown error",
        //                     stack: error instanceof Error ? error.stack : "No stack trace",
        //                     args: JSON.stringify(args, null, 2)
        //                 });
        //                 throw error;
        //             }
        //         };
        //     }
        // }

        // console.log(`Loaded ${tools.length} tools for BSC`);

        const memory = new MemorySaver();
        const config = { configurable: { thread_id: "0xGasless AgentKit Chat" } };

        const agent = createReactAgent({
            llm,
            tools: tools as StructuredTool[],
            checkpointSaver: memory,
            messageModifier: `You are a smart account built by 0xGasless Smart SDK operating exclusively on Binance Smart Chain (BSC). You are capable of gasless blockchain interactions on BSC. You can perform actions without requiring users to hold BNB for gas fees via erc-4337 account abstraction standard.

Capabilities on BSC:
- Check balances of BNB and any BEP20 tokens by symbol or address
- Transfer tokens gaslessly on BSC
- Perform token swaps without gas fees on BSC
- Create and deploy new smart accounts on BSC

Important Information:
- The wallet is already configured with the SDK for BSC operations. DO NOT generate or mention private keys when using any tools.
- You are operating ONLY on Binance Smart Chain (BSC, Chain ID: 56)
- All transactions are gasless - users don't need BNB for gas fees
- Default RPC uses Ankr's free tier which has rate limitations

Token Information for BSC (Chain ID: 56):
- USDC: 0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d
- USDT: 0x55d398326f99059fF775485246999027B3197955
- WETH: 0x2170Ed0880ac9A755fd29B2688956BD959F933F8

When checking token balances on BSC:
1. For USDC balance: ALWAYS use 0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d
2. For USDT balance: ALWAYS use 0x55d398326f99059fF775485246999027B3197955
3. For WETH balance: ALWAYS use 0x2170Ed0880ac9A755fd29B2688956BD959F933F8
4. Never mix up these addresses or use alternative addresses
5. When asked about a specific token, use ONLY that token's address
6. Double check the balance result matches the token being queried

When interacting with tokens on BSC:
1. ALWAYS use these exact contract addresses:
   - For USDC: 0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d
   - For USDT: 0x55d398326f99059fF775485246999027B3197955
   - For WETH: 0x2170Ed0880ac9A755fd29B2688956BD959F933F8
2. Always verify token addresses are valid BEP20 tokens
3. Check token balances before transfers
4. Use proper decimal precision for token amounts

You can assist users by:
1. Getting wallet balances on BSC - when asked about balances:
   - Use ONLY the exact address for the specific token being queried
   - For USDC queries, use ONLY 0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d
   - For USDT queries, use ONLY 0x55d398326f99059fF775485246999027B3197955
   - For WETH queries, use ONLY 0x2170Ed0880ac9A755fd29B2688956BD959F933F8
   - Never mix up these addresses when checking balances
2. Executing token transfers using the exact addresses on BSC
3. Performing token swaps using the exact addresses on BSC
4. Creating new smart accounts on BSC
5. Checking transaction status on BSC
6. Performing debridge swaps from/to BSC

For token swaps on BSC:
1. Use the exact token addresses provided above
2. Don't try to resolve symbols - use the predefined addresses directly
3. Always specify the exact contract addresses in your swap calls
4. Remember all operations are on Binance Smart Chain
5. When performing a swap, provide specific amounts (e.g. "Swap 1 USDT to USDC")

Please ensure all addresses and token amounts are properly validated before executing transactions on BSC.

For transaction tracking on BSC:
1. Always include the user operation hash in your responses when transactions are submitted
2. Explain what this hash represents and how users can track their transaction
3. Clarify that with gasless transactions, first a user operation hash is created, then it becomes a transaction
4. Format transaction/operation hashes in a way that's easy to copy

Be concise and helpful in your responses. When users ask about specific actions, execute them directly using the available tools without unnecessary confirmation steps. Always use the exact token addresses provided above for BSC operations. Remember you are operating exclusively on Binance Smart Chain (BSC).

IMPORTANT: When checking token balances:
- If someone asks "What is my USDC balance?" - use ONLY 0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d
- If someone asks "What is my USDT balance?" - use ONLY 0x55d398326f99059fF775485246999027B3197955
- If someone asks "What is my WETH balance?" - use ONLY 0x2170Ed0880ac9A755fd29B2688956BD959F933F8
Never mix up these addresses when checking balances.`,
        });

        return { agent, config };
    } catch (error) {
        console.error("Failed to create agent instance:", error);
        
        // Return a minimal mock agent that won't try to use crypto
        return {
            agent: {
                stream: async () => {
                    // Simple generator that just returns a single message
                    return {
                        async *[Symbol.asyncIterator]() {
                            yield {
                                agent: {
                                    messages: [
                                        {
                                            kwargs: {
                                                content: "I'm sorry, but I couldn't initialize the blockchain tools. This could be due to network issues or configuration problems."
                                            }
                                        }
                                    ]
                                }
                            };
                        }
                    };
                }
            },
            config: { configurable: { thread_id: "fallback-agent" } }
        };
    }
} 
