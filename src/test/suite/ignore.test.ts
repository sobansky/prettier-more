import * as assert from 'assert';
import { format } from '../util';

suite('Ignore Test Suite', () => {
	test('Test ignore file from formatting', async () => {
		const { formattedText, originText } = await format('project', 'ignore/index.js');

		assert.equal(formattedText, originText);
	});

	test('Test not ignored file from formatting', async () => {
		const { formattedText, originText } = await format('project', 'ignore/index.ts');

		assert.notEqual(formattedText, originText);
	});

	test('Test ignore subdir file form formatting', async () => {
		const { formattedText, originText } = await format('project', 'ignoreWithSub/subDir/index.js');

		assert.equal(formattedText, originText);
	});

	test('Test not ignore subdir file form formatting', async () => {
		const { formattedText, originText } = await format('project', 'ignoreWithSub/index.js');

		assert.notEqual(formattedText, originText);
	});

	test('Test ignore rootdir file form formatting', async () => {
		const { formattedText, originText } = await format('project', 'fileToIgnore.js');

		assert.equal(formattedText, originText);
	});
});
