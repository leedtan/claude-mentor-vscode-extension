export interface MentorConfig {
    apiKey: string;
    workspaceRoot: string;
}

export interface FileChange {
    filePath: string;
    diff: string;
    fullContent?: string;
}
