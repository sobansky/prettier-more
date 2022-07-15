import * as assert from 'assert';
import { wait, format, getText } from '../util';

const testConfig = async (testPath: string, result: string, resultIsText: boolean = false) => {
	const { formattedText } = await format('config', testPath);

	let expected = resultIsText ? result : await getText('config', result);

	await wait(500);

	assert.equal(formattedText, expected);
};

suite('Test Configuration', () => {
	test('Test tabs number', async () => {
		await testConfig('tabWidthTest/index.js', 'tabWidthTest/indexExp.js');
	});

	test('Test use tabs', async () => {
		await testConfig('useTabsTest/index.js', 'function multiple(a, b) {\r\n\treturn a * b;\r\n}\r\n', true);
	});

	test('Test arrow parens', async () => {
		await testConfig('arrowParensTest/index.js', 'arrowParensTest/indexExp.js');
	});
});
