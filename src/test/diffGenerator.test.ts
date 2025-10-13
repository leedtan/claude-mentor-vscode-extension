import * as assert from 'assert';
import { DiffGenerator } from '../diffGenerator';

suite('DiffGenerator Tests', () => {
    test('Should instantiate with workspace root', () => {
        const generator = new DiffGenerator('/test/workspace');
        assert.ok(generator);
    });

    // Note: Full integration tests would require git repo setup
});
