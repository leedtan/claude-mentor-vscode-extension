import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Claude Mentor extension is now active');

    // Register commands (we'll implement these in later tasks)
    const toggleCommand = vscode.commands.registerCommand(
        'claude-mentor.toggleMentorMode',
        () => {
            vscode.window.showInformationMessage('Toggle Mentor Mode (not implemented yet)');
        }
    );

    const showPanelCommand = vscode.commands.registerCommand(
        'claude-mentor.showPanel',
        () => {
            vscode.window.showInformationMessage('Show Panel (not implemented yet)');
        }
    );

    context.subscriptions.push(toggleCommand, showPanelCommand);
}

export function deactivate() {
    console.log('Claude Mentor extension is deactivated');
}
