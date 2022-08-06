import * as assert from 'assert';
import { wait, format, getText } from '../util';

const testConfig = async (testPath: string, result: string, resultIsText: boolean = false) => {
	const { formattedText } = await format('config', testPath);

	let expected = resultIsText ? result : await getText('config', result);

	await wait(500);

	assert.equal(formattedText, expected);
};

suite('Test Configuration', () => {
	// test('Test tabs number', async () => {
	// 	await testConfig('tabWidthTest/index.js', 'tabWidthTest/indexExp.js');
	// });

	// test('Test use tabs', async () => {
	// 	await testConfig('useTabsTest/index.js', 'function multiple(a, b) {\r\n\treturn a * b;\r\n}\r\n', true);
	// });

	// test('Test arrow parens', async () => {
	// 	await testConfig('arrowParensTest/index.js', 'arrowParensTest/indexExp.js');
	// });

	// test('Test print width', async () => {
	// 	await testConfig('printWidthTest/index.html', 'printWidthTest/indexExp.html');
	// });

	// test('Test break before else', async () => {
	// 	await testConfig('breakBeforeElseTest/index.js', 'breakBeforeElseTest/indexExp.js');
	// });

	// test('Test array bracket spacing', async () => {
	// 	await testConfig('arrayBracketSpacingTest/index.js', 'arrayBracketSpacingTest/indexExp.js');
	// });

	// test('Test break long metod chains', async () => {
	// 	await testConfig('breakLongMethodChainsTest/index.js', 'breakLongMethodChainsTest/indexExp.js');
	// });

	test('Test indent chains long metod chains', async () => {
		await testConfig('indentChainsTest/index.js', 'indentChainsTest/indexExp.js');
	});
});
