import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getOrCreateAgent } from '../../../lib/agent';
import { HumanMessage } from '@langchain/core/messages';

// Store agent instances by private key (in a real app, use a proper session mechanism)
const agentInstances = new Map();

export async function POST(request: NextRequest) {
    try {
        // Check if this is a chat action or an initialization
        const isChat = request.headers.get('x-action') === 'chat';

        if (isChat) {
            // Handle chat requests
            const body = await request.json();
            const { messages, privateKey } = body;

            if (!privateKey) {
                return NextResponse.json({
                    success: false,
                    error: 'Private key is required for chat'
                }, { status: 400 });
            }

            // Get agent instance server-side
            const instance = await getOrCreateAgent(privateKey);

            // Transform messages to the format LangChain expects
            const transformedMessages = messages.map((msg: { content: string }) => {
                return new HumanMessage(msg.content);
            });

            // Create a streaming response
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                async start(controller) {
                    try {
                        // Stream from the agent
                        const agentStream = await instance.agent.stream(
                            { messages: transformedMessages },
                            instance.config
                        );

                        for await (const chunk of agentStream) {
                            // Send each chunk to the client
                            controller.enqueue(encoder.encode(`${JSON.stringify(chunk)}\n`));
                        }
                        controller.close();
                    } catch (error) {
                        console.error('Error in stream:', error);
                        controller.enqueue(
                            encoder.encode(
                                `${JSON.stringify({
                                    error: error instanceof Error ? error.message : 'Unknown streaming error'
                                })}\n`
                            )
                        );
                        controller.close();
                    }
                }
            });

            return new Response(stream, {
                headers: {
                    'Content-Type': 'application/json',
                    'Transfer-Encoding': 'chunked'
                }
            });

        }
        
        // Handle agent initialization (no else needed)
        const { privateKey } = await request.json();

        if (!privateKey) {
            return NextResponse.json({
                success: false,
                error: 'Private key is required'
            }, { status: 400 });
        }

        try {
            // Get or create agent
            const instance = await getOrCreateAgent(privateKey);
            
            return NextResponse.json({
                success: true,
                config: instance.config
            });
        } catch (error) {
            console.error("Agent creation error:", error);
            return NextResponse.json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }, { status: 500 });
        }
        
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        }, { status: 500 });
    }
} 