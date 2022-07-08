import * as assert from 'assert';
import * as path from 'path';
import prettierx from 'prettierx';
//import * as prettier from 'prettier';
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';

// import * as myExtension from '../../extension';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getWorkspaceFolderUri = (workspaceFolderName: string) => {
	const workspaceFolder = vscode.workspace.workspaceFolders!.find(folder => {
		return folder.name === workspaceFolderName;
	});
	if (!workspaceFolder) {
		throw new Error('Folder not found in workspace. Did you forget to add the test folder to test.code-workspace?');
	}
	return workspaceFolder!.uri;
};

export async function format(workspaceFolderName: string, testFile: string) {
	const base = getWorkspaceFolderUri(workspaceFolderName);
	const absPath = path.join(base.fsPath, testFile);
	const doc = await vscode.workspace.openTextDocument(absPath);
	const text = doc.getText();

	try {
		await vscode.window.showTextDocument(doc);
	} catch (error) {
		console.log(error);
		throw error;
	}

	console.time(testFile);
	await vscode.commands.executeCommand('editor.action.formatDocument');

	console.timeEnd(testFile);

	return { formattedText: doc.getText(), originText: text };
}
async function formatSameAsPrettier(file: string) {
	const { formattedText, originText } = await format('project', file);
	const prettierFormattedText = prettierx.format(originText);

	assert.equal(formattedText, prettierFormattedText);
}
suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [ 1, 2, 3 ].indexOf(5));
		assert.strictEqual(-1, [ 1, 2, 3 ].indexOf(0));
	});

	test('TypeScript format test', async () => {
		await wait(10000);
		await formatSameAsPrettier('ugly.ts');
	});
});
