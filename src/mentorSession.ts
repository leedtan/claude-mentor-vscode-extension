import * as vscode from 'vscode';
import { MentorConfig, FileChange } from './types';

export class MentorSession {
    private isActive: boolean = false;
    private config: MentorConfig;
    private agentSession: any = null; // Will be Claude Agent SDK session

    constructor(config: MentorConfig) {
        this.config = config;
    }

    async start(): Promise<void> {
        if (this.isActive) {
            throw new Error('Mentor session already active');
        }

        // TODO: Initialize Claude Agent SDK session
        this.isActive = true;
        console.log('Mentor session started');
    }

    async stop(): Promise<void> {
        if (!this.isActive) {
            return;
        }

        // TODO: Clean up agent session
        this.isActive = false;
        this.agentSession = null;
        console.log('Mentor session stopped');
    }

    async handleFileChange(change: FileChange): Promise<string> {
        if (!this.isActive) {
            throw new Error('Mentor session not active');
        }

        // TODO: Send change to Claude and get response
        console.log(`Handling change to ${change.filePath}`);
        return `Received change to ${change.filePath}`;
    }

    getStatus(): boolean {
        return this.isActive;
    }
}
