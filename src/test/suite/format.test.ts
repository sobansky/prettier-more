import * as assert from 'assert';
import * as prettier from 'prettier';
//import { PrettierModule } from '../../types';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it

import { wait, format } from '../util';

var prettierm = require('prettier-m');

async function formatSameAsPrettier(file: string, options?: Partial<prettier.Options>) {
	const { formattedText, originText } = await format('project', file);

	const prettierOptions: prettier.Options = {
		...options,
		endOfLine: "crlf",
		...{
			filepath: file
		}
	};
	const prettierFormattedText = prettierm.format(originText, prettierOptions);

	assert.equal(formattedText, prettierFormattedText);
}
suite('Format Test Suite', () => {
	test('File format test', async () => {
		await wait(2000);

		// await formatSameAsPrettier('formatTest/ugly.ts');

		// await formatSameAsPrettier('formatTest/ugly.html');
		// await formatSameAsPrettier('formatTest/uglyWithLiterals.html');

		// await formatSameAsPrettier('formatTest/ugly.css');

		// await formatSameAsPrettier('formatTest/ugly.js');

		// await formatSameAsPrettier('formatTest/ugly.tsx');

		// await formatSameAsPrettier('formatTest/ugly.jsx');

		await formatSameAsPrettier('formatTest/ugly2.json');
	});
});
