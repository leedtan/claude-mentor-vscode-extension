# Claude Mentor VSCode Extension

Real-time code mentorship from Claude as you code. Toggle "mentor mode" to have Claude review your changes on every save, chat about your code, and help you learn better patterns.

## Features

- **Toggle Mentor Mode**: Turn on/off real-time code review
- **Automatic Review on Save**: Claude reviews your changes and provides feedback
- **Interactive Chat**: Ask Claude questions about your code
- **Contextual Understanding**: Claude can explore your codebase with Read/Grep/Glob tools
- **Learning-Focused**: Explains WHY things matter and teaches better patterns

## Setup

1. **Install the extension** (or run locally with F5 in development)

2. **Set your Anthropic API Key**:
   - Option A: VSCode Settings → Search "Claude Mentor" → Set API Key
   - Option B: Set `ANTHROPIC_API_KEY` environment variable

3. **Open a project folder** in VSCode

4. **Toggle Mentor Mode**:
   - Open Command Palette (Cmd/Ctrl+Shift+P)
   - Run "Claude Mentor: Toggle Mentor Mode"
   - Chat panel opens automatically

## Usage

### Getting Feedback
1. Toggle Mentor Mode ON
2. Edit and save any file
3. Claude reviews changes in chat panel

### Chatting with Claude
Type messages in chat input, send with Cmd/Ctrl+Enter

## Development

```bash
npm install
npm run compile
code .  # Press F5 to launch
```

## Requirements

- VSCode 1.80.0+
- Anthropic API key
- Git repository (for diffs)

## License

MIT
