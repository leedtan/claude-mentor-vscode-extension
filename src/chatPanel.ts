import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class ChatPanel {
    private panel: vscode.WebviewPanel | null = null;
    private onUserMessageCallback: ((message: string) => Promise<void>) | null = null;
    private extensionPath: string;

    constructor(extensionPath: string) {
        this.extensionPath = extensionPath;
    }

    show(): void {
        if (this.panel) {
            this.panel.reveal();
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'claudeMentor',
            'Claude Mentor',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.panel.webview.html = this.getWebviewContent();

        // Handle messages from webview
        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                if (message.type === 'userMessage' && this.onUserMessageCallback) {
                    await this.onUserMessageCallback(message.content);
                }
            }
        );

        this.panel.onDidDispose(() => {
            this.panel = null;
        });
    }

    addMessage(role: 'user' | 'assistant', content: string): void {
        if (!this.panel) {
            return;
        }

        this.panel.webview.postMessage({
            type: 'addMessage',
            role,
            content
        });
    }

    updateStatus(active: boolean): void {
        if (!this.panel) {
            return;
        }

        this.panel.webview.postMessage({
            type: 'updateStatus',
            active
        });
    }

    onUserMessage(callback: (message: string) => Promise<void>): void {
        this.onUserMessageCallback = callback;
    }

    private getWebviewContent(): string {
        const htmlPath = path.join(this.extensionPath, 'src', 'webview', 'index.html');
        return fs.readFileSync(htmlPath, 'utf8');
    }
}
