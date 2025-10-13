import * as vscode from 'vscode';
import { DiffGenerator } from './diffGenerator';
import { FileChange } from './types';

export class FileWatcher {
    private watcher: vscode.Disposable | null = null;
    private diffGenerator: DiffGenerator;
    private onFileChangeCallback: ((change: FileChange) => Promise<void>) | null = null;
    private isActive: boolean = false;

    constructor(workspaceRoot: string) {
        this.diffGenerator = new DiffGenerator(workspaceRoot);
    }

    start(onFileChange: (change: FileChange) => Promise<void>): void {
        if (this.isActive) {
            return;
        }

        this.onFileChangeCallback = onFileChange;

        // Watch for document saves
        this.watcher = vscode.workspace.onDidSaveTextDocument(
            async (document) => {
                await this.handleDocumentSave(document);
            }
        );

        this.isActive = true;
        console.log('File watcher started');
    }

    stop(): void {
        if (!this.isActive) {
            return;
        }

        if (this.watcher) {
            this.watcher.dispose();
            this.watcher = null;
        }

        this.onFileChangeCallback = null;
        this.isActive = false;
        console.log('File watcher stopped');
    }

    private async handleDocumentSave(document: vscode.TextDocument): Promise<void> {
        if (!this.onFileChangeCallback) {
            return;
        }

        // Filter out files we don't want to review
        const filePath = document.uri.fsPath;
        if (this.shouldIgnoreFile(filePath)) {
            return;
        }

        try {
            const diff = await this.diffGenerator.generateDiff(filePath);

            const change: FileChange = {
                filePath,
                diff,
                fullContent: document.getText()
            };

            await this.onFileChangeCallback(change);
        } catch (error: any) {
            console.error('Error handling document save:', error);
            vscode.window.showErrorMessage(`Claude Mentor error: ${error.message}`);
        }
    }

    private shouldIgnoreFile(filePath: string): boolean {
        // Ignore files in these directories
        const ignorePatterns = [
            '/node_modules/',
            '/.git/',
            '/dist/',
            '/out/',
            '/build/',
            '/.vscode-test/'
        ];

        // Ignore these file types
        const ignoredExtensions = [
            '.log',
            '.vsix',
            '.lock',
            '.min.js',
            '.min.css'
        ];

        return ignorePatterns.some(pattern => filePath.includes(pattern)) ||
               ignoredExtensions.some(ext => filePath.endsWith(ext));
    }

    getStatus(): boolean {
        return this.isActive;
    }
}
