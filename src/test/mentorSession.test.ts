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

    test('Should start and stop', async () => {
        const session = new MentorSession({
            apiKey: 'test-key',
            workspaceRoot: '/test/path'
        });

        await session.start();
        assert.strictEqual(session.getStatus(), true);

        await session.stop();
        assert.strictEqual(session.getStatus(), false);
    });
});
