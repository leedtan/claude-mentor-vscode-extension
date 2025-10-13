import * as vscode from 'vscode';
import { MentorSession } from './mentorSession';
import { FileWatcher } from './fileWatcher';
import { ChatPanel } from './chatPanel';
import { MentorConfig } from './types';

let mentorSession: MentorSession | null = null;
let fileWatcher: FileWatcher | null = null;
let chatPanel: ChatPanel | null = null;
let isMentorModeActive = false;

export function activate(context: vscode.ExtensionContext) {
    console.log('Claude Mentor extension is now active');

    // Initialize chat panel
    chatPanel = new ChatPanel(context.extensionPath);

    // Register toggle mentor mode command
    const toggleCommand = vscode.commands.registerCommand(
        'claude-mentor.toggleMentorMode',
        async () => {
            try {
                if (isMentorModeActive) {
                    await stopMentorMode();
                    vscode.window.showInformationMessage('Claude Mentor Mode: OFF');
                } else {
                    await startMentorMode();
                    vscode.window.showInformationMessage('Claude Mentor Mode: ON');
                }
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to toggle mentor mode: ${error.message}`);
            }
        }
    );

    // Register show panel command
    const showPanelCommand = vscode.commands.registerCommand(
        'claude-mentor.showPanel',
        () => {
            if (chatPanel) {
                chatPanel.show();
            }
        }
    );

    context.subscriptions.push(toggleCommand, showPanelCommand);
}

export function deactivate() {
    if (isMentorModeActive) {
        stopMentorMode();
    }
}

async function startMentorMode(): Promise<void> {
    if (isMentorModeActive) {
        vscode.window.showWarningMessage('Mentor mode is already active');
        return;
    }

    try {
        // Get API key from config or environment
        const config = vscode.workspace.getConfiguration('claudeMentor');
        const apiKey = config.get<string>('apiKey') || process.env.ANTHROPIC_API_KEY;

        if (!apiKey) {
            const action = await vscode.window.showErrorMessage(
                'No Anthropic API key found.',
                'Open Settings'
            );
            if (action === 'Open Settings') {
                vscode.commands.executeCommand('workbench.action.openSettings', 'claudeMentor.apiKey');
            }
            return;
        }

        // Get workspace root
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder open. Please open a folder first.');
            return;
        }
        const workspaceRoot = workspaceFolders[0].uri.fsPath;

        // Create mentor config
        const mentorConfig: MentorConfig = {
            apiKey,
            workspaceRoot
        };

        // Initialize with progress indicator
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Starting Claude Mentor...',
                cancellable: false
            },
            async (progress) => {
                progress.report({ increment: 30, message: 'Initializing agent...' });

                mentorSession = new MentorSession(mentorConfig);
                await mentorSession.start();

                progress.report({ increment: 40, message: 'Starting file watcher...' });

                // Initialize file watcher
                fileWatcher = new FileWatcher(workspaceRoot);
                fileWatcher.start(async (change) => {
                    if (mentorSession && chatPanel) {
                        try {
                            chatPanel.addMessage('user', `📝 Saved: ${change.filePath}`);
                            const response = await mentorSession.handleFileChange(change);
                            chatPanel.addMessage('assistant', response);
                        } catch (error: any) {
                            console.error('Error processing file change:', error);
                            chatPanel.addMessage('assistant', `⚠️ Error: ${error.message}`);
                        }
                    }
                });

                progress.report({ increment: 30, message: 'Opening chat panel...' });

                // Set up chat panel
                if (chatPanel) {
                    chatPanel.show();
                    chatPanel.updateStatus(true);
                    chatPanel.addMessage('assistant', '👋 Hi! I\'m ready to review your code. Save a file to get started, or ask me anything.');

                    chatPanel.onUserMessage(async (message) => {
                        if (mentorSession && chatPanel) {
                            try {
                                const response = await mentorSession.handleFileChange({
                                    filePath: 'chat',
                                    diff: message,
                                });
                                chatPanel.addMessage('assistant', response);
                            } catch (error: any) {
                                console.error('Error handling user message:', error);
                                chatPanel.addMessage('assistant', `⚠️ Error: ${error.message}`);
                            }
                        }
                    });
                }
            }
        );

        isMentorModeActive = true;
    } catch (error: any) {
        console.error('Failed to start mentor mode:', error);
        vscode.window.showErrorMessage(`Failed to start Claude Mentor: ${error.message}`);

        // Cleanup on error
        if (fileWatcher) {
            fileWatcher.stop();
            fileWatcher = null;
        }
        if (mentorSession) {
            await mentorSession.stop();
            mentorSession = null;
        }
    }
}

async function stopMentorMode(): Promise<void> {
    if (!isMentorModeActive) {
        return;
    }

    if (fileWatcher) {
        fileWatcher.stop();
        fileWatcher = null;
    }

    if (mentorSession) {
        await mentorSession.stop();
        mentorSession = null;
    }

    if (chatPanel) {
        chatPanel.updateStatus(false);
    }

    isMentorModeActive = false;
}
