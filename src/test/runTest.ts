import * as path from 'path';
import * as tmp from 'tmp';
import * as fs from 'fs-extra';

import { runTests } from '@vscode/test-electron';

async function createTempDir() {
	return new Promise<string>((resolve, reject) => {
		tmp.dir((err, dir) => {
			if (err) {
				return reject(err);
			}

			resolve(dir);
		});
	});
}
async function createSettings(): Promise<string> {
	const userDataDirectory = await createTempDir();
	process.env.VSC_JUPYTER_VSCODE_SETTINGS_DIR = userDataDirectory;
	const settingsFile = path.join(userDataDirectory, 'User', 'settings.json');
	const defaultSettings: Record<string, string | boolean | string[]> = {
		'editor.defaultFormatter': 'marbos.prettier-more',
		'prettier-more.enableDebugLogs': true
	};

	fs.ensureDirSync(path.dirname(settingsFile));
	fs.writeFileSync(settingsFile, JSON.stringify(defaultSettings, undefined, 4));
	return userDataDirectory;
}

async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');

		// The path to test runner
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index');

		const workspacePath = path.resolve('test-assets', 'test.code-workspace');

		const userDataDirectory = await createSettings();

		// Download VS Code, unzip it and run the integration test
		await runTests({
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: [ workspacePath ]
				.concat([ '--skip-welcome' ])
				.concat([ '--disable-extensions' ])
				.concat([ '--skip-release-notes' ])
				.concat([ '--user-data-dir', userDataDirectory ])
		});
	} catch (err) {
		console.error('Failed to run tests');
		process.exit(1);
	}
}

main();
