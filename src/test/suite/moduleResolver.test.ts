import * as assert from 'assert';
//import * as vscode from 'vscode';
import { LoggingService } from '../../loggingService';
import { ModuleResolver } from '../../ModuleResolver';

suite('ModuleResolver Test Suite', () => {
	let moduleResolver: ModuleResolver;

	test('Make instance', () => {
		const loggingService = new LoggingService();

		assert.doesNotThrow(() => {
			moduleResolver = new ModuleResolver(loggingService);

			moduleResolver.dispose();
		});
	});

	test('Get prettier instance', () => {
		assert.doesNotThrow(() => {
			moduleResolver.getGlobalPrettierInstance();
		});
	});

	test('Format by global prettier instance', () => {
		let prettier = moduleResolver.getGlobalPrettierInstance();
		let text = 'let x = 3; if (x === 2) {x = 3;} else {x =1;}';
		let formattedText = prettier.format(text);

		assert.notEqual(text, formattedText);
	});
});
