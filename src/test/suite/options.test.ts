import * as assert from 'assert';
//import * as path from 'path';
import * as prettier from 'prettier';
//import * as vscode from 'vscode';
import { LoggingService } from '../../loggingService';
import { ModuleResolver } from '../../ModuleResolver';

suite('Options test', () => {
	let moduleResolver: ModuleResolver = new ModuleResolver(new LoggingService());
	let prettier = moduleResolver.getGlobalPrettierInstance();
	//const prettierConfig = path.resolve(__dirname, '../../../.prettierrc');

	const prettierOptions: prettier.Options = {
		singleQuote: true
	};
	test('Single quotes test', () => {
		let text = 'let newText = "its value";';
		let result = prettier.format(text, prettierOptions);

		assert.deepStrictEqual(result, "let newText = 'its value';\n");
	});
});
