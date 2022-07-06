// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { commands, ExtensionContext, workspace } from 'vscode';
import { LoggingService } from './LoggingService';
import { getConfig } from './util';
import { EXTENSION_DISABLED, RESTART_TO_ENABLE } from './message';
import { ModuleResolver } from './ModuleResolver';
import { TemplateService } from './TemplateService';
import { StatusBar } from './StatusBar';
import PrettierEditService from './PrettierEditService';
import { createConfigFile } from './commands';

const extensionName = process.env.EXTENSION_NAME;
const extensionVersion = process.env.EXTENSION_VERSION;

export function activate(context: ExtensionContext) {
	const loggingService = new LoggingService();
	const { enable } = getConfig();

	loggingService.logInfo(`Extension Name: ${extensionName}.`);
	loggingService.logInfo(`Extension Version: ${extensionVersion}`);

	if (!enable) {
		loggingService.logInfo(EXTENSION_DISABLED);
		context.subscriptions.push(
			workspace.onDidChangeConfiguration(event => {
				if (event.affectsConfiguration('prettier-more.enable')) {
					loggingService.logWarning(RESTART_TO_ENABLE);
				}
			})
		);

		return;
	}

	const moduleResolver = new ModuleResolver(loggingService);

	const templateService = new TemplateService(loggingService, moduleResolver.getGlobalPrettierInstance());

	const statusBar = new StatusBar();

	const editService = new PrettierEditService(moduleResolver, loggingService, statusBar);
	editService.registerGlobal();

	const createConfigFileFunc = createConfigFile(templateService);
	const createConfigFileCommand = commands.registerCommand('prettier-more.createConfigFile', createConfigFileFunc);
	const openOutputCommand = commands.registerCommand('prettier-more.openOutput', () => {
		loggingService.show();
	});

	const forceFormatDocumentCommand = commands.registerCommand('prettier-more.forceFormatDocument', editService.forceFormatDocument);

	context.subscriptions.push(editService, createConfigFileCommand, openOutputCommand, forceFormatDocumentCommand, ...editService.registerDisposables());
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	// let disposable = vscode.commands.registerCommand('prettier-more-vscode.helloWorld', () => {
	// 	// The code you place here will be executed every time your command is executed
	// 	// Display a message box to the user
	// 	vscode.window.showInformationMessage('Hello World from Prettier More!');
	// });

	// context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
