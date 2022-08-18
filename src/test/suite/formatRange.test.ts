import * as assert from 'assert';
import * as vscode from 'vscode';
import { wait } from '../util';

suite('Test Format Document Range', () => {
	test('Formatting typescript doc ranges', async () => {
		await wait(500);

		const input = `\
	let var1 =          "format me";
	let     var2    = "don't touch me";
	let         var3    =   "format me too, please";`;

		const expectedOutput = `\
	let var1 = "format me";
	let     var2    = "don't touch me";
	let var3 = "format me too, please";`;

		const doc = await vscode.workspace.openTextDocument({ content: input, language: 'typescript' }).then(d => {
			return d;
		});

		vscode.window.showInformationMessage('Starting formating...');
		await wait(2000);

		const editor = await vscode.window.showTextDocument(doc).then(e => {
			return e;
		});

		editor.selections = [ new vscode.Selection(0, 1, 0, 21), new vscode.Selection(2, 1, 2, 23) ];

		await vscode.commands.executeCommand('editor.action.formatSelection').then(r => {
			return r;
		});
		await wait(2000);

		const output = doc.getText();

		vscode.commands.executeCommand('workbench.action.closeActiveEditor');

		assert.equal(output, expectedOutput);
	});
});
