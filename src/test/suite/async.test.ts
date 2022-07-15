import * as assert from 'assert';
//import { before } from 'mocha';
import * as vscode from 'vscode';

async function wait(ms: number): Promise<void> {
	return new Promise((resolve, reject) => setTimeout(resolve, ms));
}

async function testVscode() {
	vscode.window.showInformationMessage('I am here!');

	await wait(2000);
}

async function testReturnValue(number: number) {
	vscode.window.showInformationMessage('Testing returnin value!');

	await wait(2000);

	return number + 2;
}

suite('Async Test Suite', () => {
	test('Wait func test', async () => {
		await wait(2000);

		assert.deepStrictEqual(2, 2);
	});

	test('Another async func', async () => {
		await testVscode();

		assert.deepStrictEqual(2, 2);
	});

	test('Returning value async', async () => {
		let result = await testReturnValue(3);

		assert.deepStrictEqual(result, 5);
	});
});
