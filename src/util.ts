import * as os from 'os';
import path = require('path');
import { Uri, workspace } from 'vscode';
import { PrettierVSCodeConfig } from './types';

export function getConfig(uri?: Uri): PrettierVSCodeConfig {
	const config = (workspace.getConfiguration('prettier-more', uri) as unknown) as PrettierVSCodeConfig;

	if (!workspace.isTrusted) {
		const newConfig = {
			...config,
			prettierPath: undefined,
			configPath: undefined,
			ignorePath: '.prettierignore',
			documentSelectors: [],
			useEditorConfig: false,
			withNodeModules: false,
			resolveGlobalModules: false
		};

		return newConfig;
	}

	return config;
}

export function getWorkspaceRelativePath(filePath: string, pathToResolve: string) {
	// In case the user wants to use ~/.prettierrc on Mac
	if (process.platform === 'darwin' && pathToResolve.indexOf('~') === 0 && os.homedir()) {
		return pathToResolve.replace(/^~(?=$|\/|\\)/, os.homedir());
	}

	if (workspace.workspaceFolders) {
		const folder = workspace.getWorkspaceFolder(Uri.file(filePath));
		return folder ? (path.isAbsolute(pathToResolve) ? pathToResolve : path.join(folder.uri.fsPath, pathToResolve)) : undefined;
	}
}
