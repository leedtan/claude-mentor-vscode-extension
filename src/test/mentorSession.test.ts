import * as assert from 'assert';
import { MentorSession } from '../mentorSession';

suite('MentorSession Tests', () => {
    test('Should instantiate with config', () => {
        const session = new MentorSession({
            apiKey: 'test-key',
            workspaceRoot: '/test/path'
        });
        assert.ok(session);
        assert.strictEqual(session.getStatus(), false);
    });

    // Note: Integration tests with actual SDK would require API key
    // and are better suited for manual testing or E2E test suite
});
