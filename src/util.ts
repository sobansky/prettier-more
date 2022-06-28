import { Uri, workspace } from 'vscode';
import { PrettierVSCodeConfig } from './types';

//TODO: Necessary to add advanced configuration
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
