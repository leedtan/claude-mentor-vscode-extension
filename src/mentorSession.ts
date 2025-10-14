import * as vscode from 'vscode';
import { MentorConfig, FileChange } from './types';
import type { Query, SDKUserMessage } from '@anthropic-ai/claude-agent-sdk' with { 'resolution-mode': 'import' };

// Dynamic import for ESM SDK
let queryFunction: any;

export class MentorSession {
    private isActive: boolean = false;
    private config: MentorConfig;
    private agentSession: Query | null = null;
    private messageGenerator: AsyncGenerator<SDKUserMessage, void, unknown> | null = null;
    private sendMessage: ((message: SDKUserMessage) => void) | null = null;

    constructor(config: MentorConfig) {
        this.config = config;
    }

    async start(): Promise<void> {
        if (this.isActive) {
            throw new Error('Mentor session already active');
        }

        try {
            // Dynamic import of ESM SDK
            if (!queryFunction) {
                const sdk = await import('@anthropic-ai/claude-agent-sdk');
                queryFunction = sdk.query;
            }

            // Create streaming input generator for multi-turn conversation
            const { generator, send } = this.createStreamingInput();
            this.messageGenerator = generator;
            this.sendMessage = send;

            // Initialize Claude Agent with streaming input
            // Note: SDK will auto-detect ANTHROPIC_API_KEY from environment
            const options: any = {
                cwd: this.config.workspaceRoot,
                systemPrompt: `You are a code mentor providing real-time feedback to a developer.

Your role:
- Review code changes for bugs, issues, and improvements
- Explain WHY things matter and teach better patterns
- Ask clarifying questions about design choices
- Offer to fix issues (but let the developer decide)

Guidelines:
- Be concise but pedagogical
- Focus on learning, not just correctness
- Use the Read, Grep, and Glob tools to understand context
- Respond conversationally in markdown format`,
                allowedTools: ['Read', 'Grep', 'Glob', 'Bash'],
                permissionMode: 'bypassPermissions', // Auto-approve tool use for read operations
            };

            // Only pass API key if explicitly configured (otherwise SDK uses environment)
            if (this.config.apiKey) {
                options.env = {
                    ANTHROPIC_API_KEY: this.config.apiKey
                };
            }

            this.agentSession = queryFunction({
                prompt: generator,
                options
            });

            this.isActive = true;
            console.log('Mentor session started with Claude Agent SDK');
        } catch (error) {
            console.error('Failed to start mentor session:', error);
            throw error;
        }
    }

    async stop(): Promise<void> {
        if (!this.isActive) {
            return;
        }

        if (this.agentSession) {
            try {
                // Interrupt the agent session
                await this.agentSession.interrupt();
            } catch (error) {
                console.error('Error interrupting agent session:', error);
            }
        }

        this.isActive = false;
        this.agentSession = null;
        this.messageGenerator = null;
        this.sendMessage = null;
        console.log('Mentor session stopped');
    }

    async handleFileChange(change: FileChange, onResponse?: (text: string) => void): Promise<string> {
        if (!this.isActive || !this.sendMessage || !this.agentSession) {
            throw new Error('Mentor session not active');
        }

        try {
            // Format the message with file change context
            const messageText = change.filePath === 'chat'
                ? change.diff // Direct chat message
                : `I just saved a file. Here's what changed:

**File:** \`${change.filePath}\`

**Diff:**
\`\`\`diff
${change.diff}
\`\`\`

Please review this change and provide feedback. Look for:
- Potential bugs or issues
- Better patterns or practices
- Areas that need clarification

Feel free to use Read, Grep, or Glob to explore more context if needed.`;

            // Send message to the streaming input
            const message: SDKUserMessage = {
                type: 'user',
                session_id: 'mentor-session',
                message: {
                    role: 'user',
                    content: messageText
                },
                parent_tool_use_id: null
            };

            this.sendMessage(message);

            // Collect response from the agent
            let responseText = '';
            let foundResponse = false;

            // Read messages until we get an assistant response
            for await (const msg of this.agentSession) {
                if (msg.type === 'assistant') {
                    // Extract text content from assistant message
                    const content = msg.message.content;
                    for (const block of content) {
                        if (block.type === 'text') {
                            responseText += block.text;
                            if (onResponse) {
                                onResponse(block.text);
                            }
                        }
                    }
                    foundResponse = true;
                } else if (msg.type === 'result') {
                    // Conversation turn completed
                    break;
                }
            }

            return responseText || 'No response received from Claude.';
        } catch (error: any) {
            console.error('Error handling file change:', error);
            return `Error: ${error.message}`;
        }
    }

    private createStreamingInput(): {
        generator: AsyncGenerator<SDKUserMessage, void, unknown>;
        send: (message: SDKUserMessage) => void;
    } {
        const queue: SDKUserMessage[] = [];
        let resolve: ((value: IteratorResult<SDKUserMessage>) => void) | null = null;
        let done = false;

        const generator = (async function* () {
            while (!done) {
                if (queue.length > 0) {
                    yield queue.shift()!;
                } else {
                    // Wait for next message
                    await new Promise<IteratorResult<SDKUserMessage>>(r => {
                        resolve = r;
                    });
                    if (queue.length > 0) {
                        yield queue.shift()!;
                    }
                }
            }
        })();

        const send = (message: SDKUserMessage) => {
            queue.push(message);
            if (resolve) {
                resolve({ value: message, done: false });
                resolve = null;
            }
        };

        return { generator, send };
    }

    getStatus(): boolean {
        return this.isActive;
    }

    getAgentSession(): Query | null {
        return this.agentSession;
    }
}
