import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import { promisify } from 'util';

const exec = promisify(cp.exec);

export class DiffGenerator {
    private workspaceRoot: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    async generateDiff(filePath: string): Promise<string> {
        try {
            // Get relative path from workspace root
            const relativePath = path.relative(this.workspaceRoot, filePath);

            // Use git diff to get changes
            const { stdout } = await exec(
                `git diff HEAD "${relativePath}"`,
                { cwd: this.workspaceRoot }
            );

            // If no diff from HEAD, file might be untracked
            if (!stdout.trim()) {
                // Try to get the full file as "new file"
                const document = await vscode.workspace.openTextDocument(filePath);
                const content = document.getText();
                return `+++ New or untracked file +++\n${content}`;
            }

            return stdout;
        } catch (error) {
            console.error('Error generating diff:', error);
            // Fallback: return full file content
            const document = await vscode.workspace.openTextDocument(filePath);
            return `Full file content:\n${document.getText()}`;
        }
    }
}
