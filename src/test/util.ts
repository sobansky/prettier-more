import * as vscode from 'vscode';
import * as path from 'path';
import { promisify } from 'util';
import { readFile } from 'fs';
//import { Done } from 'mocha';

export async function wait(ms: number): Promise<void> {
	return new Promise((resolve, reject) => setTimeout(resolve, ms));
}

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
	const doc = await vscode.workspace.openTextDocument(absPath).then(d => {
		return d;
	});
	const text = doc.getText();

	try {
		vscode.window.showTextDocument(doc);
		await wait(500);
	} catch (error) {
		console.log(error);
		throw error;
	}

	console.time(testFile);
	vscode.commands.executeCommand('editor.action.formatDocument');

	console.timeEnd(testFile);

	//vscode.commands.executeCommand('workbench.action.closeActiveEditor');

	await wait(5000);
	return { formattedText: doc.getText(), originText: text };
}

const readFileAsync: (filePath: string, encoding: 'utf8') => Promise<string> = promisify(readFile);

export async function getText(workspaceFolderName: string, expectedFile: string) {
	const base = getWorkspaceFolderUri(workspaceFolderName);
	const expectedPath = path.join(base.fsPath, expectedFile);
	const expected = await readFileAsync(expectedPath, 'utf8').then(s => {
		return s;
	});
	return expected;
}

// const prettierConfigOrig =
// export function moveRootPrettierRC(done: Done) {
// 	rename(prettierConfigOrig, prettierConfigTemp, done);
//   }

//   export function putBackPrettierRC(done: Done) {
// 	rename(prettierConfigTemp, prettierConfigOrig, done);
//   }
