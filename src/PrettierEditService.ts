import { Disposable, DocumentFilter, languages, Range, TextDocument, TextEdit, TextEditor, Uri, window, workspace } from 'vscode';
import { getParserFromLanguageId } from './LanguageFilters';
import { LoggingService } from './loggingService';
import { RESTART_TO_ENABLE } from './message';
import { PrettierEditProvider } from './PrettierEditProvider';
import { FormatterStatus, StatusBar } from './StatusBar';
import {
	ExtensionFormattingOptions,
	ModuleResolverInterface,
	PrettierBuiltInParserName,
	PrettierFileInfoResult,
	PrettierModule,
	PrettierOptions,
	RangeFormattingOptions
} from './types';
import { getConfig } from './util';

interface ISelectors {
	rangeLanguageSelector: ReadonlyArray<DocumentFilter>;
	languageSelector: ReadonlyArray<DocumentFilter>;
}

const PRETTIER_CONFIG_FILES = [
	'.prettierrc',
	'.prettierrc.json',
	'.prettierrc.json5',
	'.prettierrc.yaml',
	'.prettierrc.yml',
	'.prettierrc.toml',
	'.prettierrc.js',
	'.prettierrc.cjs',
	'package.json',
	'prettier.config.js',
	'prettier.config.cjs',
	'.editorconfig'
];

export default class PrettierEditService implements Disposable {
	private formatterHandler: undefined | Disposable;
	private rangeFormatterHandler: undefined | Disposable;
	private registeredWorkspaces = new Set<string>();

	private allLanguages: string[] = [];
	private allExtensions: string[] = [];
	private allRangeLanguages: string[] = [ 'javascript', 'javascriptreact', 'typescript', 'typescriptreact', 'json', 'jsonc', 'graphql', 'handlebars' ];

	constructor(private moduleResolver: ModuleResolverInterface, private loggingService: LoggingService, private statusBar: StatusBar) {}

	public registerDisposables(): Disposable[] {
		const packageWatcher = workspace.createFileSystemWatcher('**/package.json');
		packageWatcher.onDidChange(this.resetFormatters);
		packageWatcher.onDidCreate(this.resetFormatters);
		packageWatcher.onDidDelete(this.resetFormatters);

		const configurationWatcher = workspace.onDidChangeConfiguration(event => {
			if (event.affectsConfiguration('prettier-more.enable')) {
				this.loggingService.logWarning(RESTART_TO_ENABLE);
			}
			else if (event.affectsConfiguration('prettier-more')) {
				this.resetFormatters();
			}
		});

		const prettierConfigWatcher = workspace.createFileSystemWatcher(`**/{${PRETTIER_CONFIG_FILES.join(',')}}`);

		prettierConfigWatcher.onDidChange(this.prettierConfigChanged);
		prettierConfigWatcher.onDidCreate(this.prettierConfigChanged);
		prettierConfigWatcher.onDidDelete(this.prettierConfigChanged);

		const textEditorChange = window.onDidChangeActiveTextEditor(this.handleActiveTextEditorChanged);

		this.handleActiveTextEditorChanged(window.activeTextEditor);

		return [ packageWatcher, configurationWatcher, prettierConfigWatcher, textEditorChange ];
	}

	public forceFormatDocument = async () => {
		try {
			const editor = window.activeTextEditor;
			if (!editor) {
				this.loggingService.logInfo('No active document. Nothing was formatted.');
				return;
			}

			this.loggingService.logInfo('Forced formatting will not use ignore files.');

			const edits = await this.provideEdits(editor.document, { force: true });
			if (edits.length !== 1) {
				return;
			}

			await editor.edit((editBuilder) => {
				editBuilder.replace(edits[0].range, edits[0].newText);
			});			
		} catch (error) {
			this.loggingService.logError('Error formatting document', error);
		}
	};

	private resetFormatters = async (uri?: Uri) => {
		if (uri) {
			const workspaceFolder = workspace.getWorkspaceFolder(uri);			
			this.registeredWorkspaces.delete(workspaceFolder?.uri.fsPath ?? "global");
		}
		else {
			// VS Code config change, reset everything
			this.registeredWorkspaces.clear();
		}

		this.statusBar.update(FormatterStatus.Ready);
	};

	private prettierConfigChanged = async (uri: Uri) => this.resetFormatters(uri);

	private handleActiveTextEditorChanged = async (textEditor: TextEditor | undefined) => {
		if (!textEditor) {
			this.statusBar.hide();
			return;
		}

		const { document } = textEditor;

		if (document.uri.scheme !== 'file') {
			// We set as ready for untitled documents,
			// but return because these will always
			// use the global registered formatter.
			this.statusBar.update(FormatterStatus.Ready);
			return;
		}

		const workspaceFolder = workspace.getWorkspaceFolder(document.uri);

		if (!workspaceFolder) {
			// Do nothing, this is only for registering formatters in workspace folder.
			return;
		}

		const prettierInstance = await this.moduleResolver.getPrettierInstance(workspaceFolder.uri.fsPath);

		const isRegistered = this.registeredWorkspaces.has(workspaceFolder.uri.fsPath);

		if (!prettierInstance) {
			this.statusBar.update(FormatterStatus.Error);
			return;
		}

		const selectors = await this.getSelectors(prettierInstance, workspaceFolder.uri);

		if (!isRegistered) {
			this.registerDocumentFormatEditorProviders(selectors);
			this.registeredWorkspaces.add(workspaceFolder.uri.fsPath);
			this.loggingService.logDebug(`Enabling Prettier for Workspace ${workspaceFolder.uri.fsPath}`, selectors);
		}

		const score = languages.match(selectors.languageSelector, document);
		if (score > 0) {
			this.statusBar.update(FormatterStatus.Ready);
		}
		else {
			this.statusBar.update(FormatterStatus.Disabled);
		}
	};

	/**
   * Build formatter selectors
   */
	private getSelectors = async (prettierInstance: PrettierModule, uri?: Uri): Promise<ISelectors> => {
		const { languages } = prettierInstance.getSupportInfo();

		languages.forEach(lang => {
			if (lang && lang.vscodeLanguageIds) {
				this.allLanguages.push(...lang.vscodeLanguageIds);
			}
		});
		this.allLanguages = this.allLanguages.filter((value, index, self) => {
			return self.indexOf(value) === index;
		});

		languages.forEach(lang => {
			if (lang && lang.extensions) {
				this.allExtensions.push(...lang.extensions);
			}
		});
		this.allExtensions = this.allExtensions.filter((value, index, self) => {
			return self.indexOf(value) === index;
		});

		const { documentSelectors } = getConfig();

		const extensionLanguageSelector: DocumentFilter[] = uri
			? this.allExtensions.length === 0
				? []
				: [
						{
							pattern: `${uri.fsPath}/**/*.{${this.allExtensions.map(e => e.substring(1)).join(',')}}`,
							scheme: 'file'
						}
					]
			: [];

		const customLanguageSelectors: DocumentFilter[] = uri
			? documentSelectors.map(pattern => ({
					pattern: `${uri.fsPath}/${pattern}`,
					scheme: 'file'
				}))
			: [];

		const defaultLanguageSelectors: DocumentFilter[] = [
			...this.allLanguages.map(language => ({ language })),
			{ language: 'jsonc', scheme: 'vscode-userdata' } // Selector for VSCode settings.json
		];

		const languageSelector = [ ...customLanguageSelectors, ...extensionLanguageSelector, ...defaultLanguageSelectors ];

		const rangeLanguageSelector: DocumentFilter[] = [
			...this.allRangeLanguages.map(language => ({
				language
			}))
		];

		return { languageSelector, rangeLanguageSelector };
	};

	public async registerGlobal() {
		const selectors = await this.getSelectors(this.moduleResolver.getGlobalPrettierInstance());
		this.registerDocumentFormatEditorProviders(selectors);
		this.loggingService.logDebug('Enabling Prettier globally', selectors);
	}

	private registerDocumentFormatEditorProviders({ languageSelector, rangeLanguageSelector }: ISelectors) {
		this.dispose();

		const editProvider = new PrettierEditProvider(this.provideEdits);
		this.rangeFormatterHandler = languages.registerDocumentRangeFormattingEditProvider(rangeLanguageSelector, editProvider);
		this.formatterHandler = languages.registerDocumentFormattingEditProvider(languageSelector, editProvider);
	}

	public dispose = () => {
		this.moduleResolver.dispose();		
		this.formatterHandler?.dispose();
		this.rangeFormatterHandler?.dispose();
		this.formatterHandler = undefined;
		this.rangeFormatterHandler = undefined;
	};

	private provideEdits = async (document: TextDocument, options: ExtensionFormattingOptions): Promise<TextEdit[]> => {
		const startTime = new Date().getTime();
		const result = await this.format(document.getText(), document, options);
		if (!result) {
			return [];
		}
		const duration = new Date().getTime() - startTime;

		this.loggingService.logInfo(`Formatting completed in ${duration}ms.`);
		const edit = this.minimalEdit(document, result);
		return [ edit ];
	};

	/**
   * Format the given text with user's configuration.
   * @param text Text to format
   * @param path formatting file's path
   * @returns {string} formatted text
   */
	private async format(text: string, doc: TextDocument, options: ExtensionFormattingOptions): Promise<string | undefined> {
		const { fileName, uri, languageId } = doc;

		this.loggingService.logInfo(`Formatting ${uri}`);

		const vscodeConfig = getConfig(uri);

		const resolvedConfig = await this.moduleResolver.getResolvedConfig(doc, vscodeConfig);
		if (resolvedConfig === 'error') {
			this.statusBar.update(FormatterStatus.Error);
			return;
		}
		if (resolvedConfig === 'disabled') {
			this.statusBar.update(FormatterStatus.Disabled);
			return;
		}

		const prettierInstance = await this.moduleResolver.getPrettierInstance(fileName);

		if (!prettierInstance) {
			this.loggingService.logError('Prettier could not be loaded. See previous logs for more information.');
			this.statusBar.update(FormatterStatus.Error);
			return;
		}

		let resolvedIgnorePath: string | undefined;
		if (vscodeConfig.ignorePath) {
			resolvedIgnorePath = await this.moduleResolver.getResolvedIgnorePath(fileName, vscodeConfig.ignorePath);

			if (resolvedIgnorePath) {
				this.loggingService.logInfo(`Using ignore file (if present) at ${resolvedIgnorePath}`);
			}
		}

		let fileInfo: PrettierFileInfoResult | undefined;
		if (fileName) {
			fileInfo = await prettierInstance.getFileInfo(fileName, {
				ignorePath: resolvedIgnorePath,
				resolveConfig: true,
				withNodeModules: vscodeConfig.withNodeModules
			});
			this.loggingService.logInfo('File Info:', fileInfo);
		}

		if (!options.force && fileInfo && fileInfo.ignored) {
			this.loggingService.logInfo('File is ignored, skipping.');
			this.statusBar.update(FormatterStatus.Ignore);
			return;
		}

		let parser: PrettierBuiltInParserName | string | undefined;
		if (fileInfo && fileInfo.inferredParser) {
			parser = fileInfo.inferredParser;
		}
		else if (languageId !== 'plaintext') {
			this.loggingService.logWarning(`Parser not inferred, trying VS Code language.`);
			const languages = prettierInstance.getSupportInfo().languages;
			parser = getParserFromLanguageId(languages, uri, languageId);
		}

		if (!parser) {
			this.loggingService.logError(
				'Failed to resolve a parser, skipping file. If you registered a custom file extension, be sure to configure the parser.'
			);
			this.statusBar.update(FormatterStatus.Error);
			return;
		}

		const prettierOptions = this.getPrettierOptions(fileName, parser as PrettierBuiltInParserName, vscodeConfig, resolvedConfig, options);

		this.loggingService.logInfo('Prettier-More Options:', prettierOptions);

		try {
			const formattedText = prettierInstance.format(text, prettierOptions);
			this.statusBar.update(FormatterStatus.Success);

			return formattedText;
		} catch (error) {
			this.loggingService.logError('Error formatting document.', error);
			this.statusBar.update(FormatterStatus.Error);

			return text;
		}
	}

	private getPrettierOptions(
		fileName: string,
		parser: PrettierBuiltInParserName,
		vscodeConfig: PrettierOptions,
		configOptions: PrettierOptions | null,
		extensionFormattingOptions: ExtensionFormattingOptions
	): Partial<PrettierOptions> {
		const fallbackToVSCodeConfig = configOptions === null;

		const vsOpts: PrettierOptions = {};
		
		if (fallbackToVSCodeConfig) {
			vsOpts.arrowParens = vscodeConfig.arrowParens;
			vsOpts.bracketSpacing = vscodeConfig.bracketSpacing;
			vsOpts.endOfLine = vscodeConfig.endOfLine;
			vsOpts.htmlWhitespaceSensitivity = vscodeConfig.htmlWhitespaceSensitivity;
			vsOpts.insertPragma = vscodeConfig.insertPragma;
			vsOpts.jsxBracketSameLine = vscodeConfig.jsxBracketSameLine;
			vsOpts.jsxSingleQuote = vscodeConfig.jsxSingleQuote;
			vsOpts.printWidth = vscodeConfig.printWidth;
			vsOpts.proseWrap = vscodeConfig.proseWrap;
			vsOpts.quoteProps = vscodeConfig.quoteProps;
			vsOpts.requirePragma = vscodeConfig.requirePragma;
			vsOpts.semi = vscodeConfig.semi;
			vsOpts.singleQuote = vscodeConfig.singleQuote;
			vsOpts.tabWidth = vscodeConfig.tabWidth;
			vsOpts.trailingComma = vscodeConfig.trailingComma;
			vsOpts.useTabs = vscodeConfig.useTabs;
			vsOpts.vueIndentScriptAndStyle = vscodeConfig.vueIndentScriptAndStyle;
			vsOpts.arrayBracketSpacing = vscodeConfig.arrayBracketSpacing;
			vsOpts.breakBeforeElse = vscodeConfig.breakBeforeElse;
			vsOpts.breakLongMethodChains = vscodeConfig.breakLongMethodChains;
			vsOpts.indentChains = vscodeConfig.indentChains;
		}

		this.loggingService.logInfo(
			fallbackToVSCodeConfig
				? 'No local configuration (i.e. .prettierrc or .editorconfig) detected, falling back to VS Code configuration'
				: 'Detected local configuration (i.e. .prettierrc or .editorconfig), VS Code configuration will not be used'
		);

		let rangeFormattingOptions: RangeFormattingOptions | undefined;
		if (extensionFormattingOptions.rangeEnd && extensionFormattingOptions.rangeStart) {
			rangeFormattingOptions = {
				rangeEnd: extensionFormattingOptions.rangeEnd,
				rangeStart: extensionFormattingOptions.rangeStart
			};
		}

		const options: PrettierOptions = {
			...fallbackToVSCodeConfig ? vsOpts : {},
			...{
				filepath: fileName,
				parser: parser as PrettierBuiltInParserName
			},
			...rangeFormattingOptions || {},
			...configOptions || {}
		};

		if (extensionFormattingOptions.force && options.requirePragma === true) {
			options.requirePragma = false;
		}

		return options;
	}

	private minimalEdit(document: TextDocument, text: string) {
		const docText = document.getText();
		let i = 0;
		while (i < docText.length && i < text.length && docText[i] === text[i]) {
			++i;
		}

		let j = 0;
		while (i + j < docText.length && i + j < text.length && docText[docText.length - j - 1] === text[text.length - j - 1]) {
			++j;
		}

		const newText = text.substring(i, text.length - j);
		const pos0 = document.positionAt(i);
		const pos1 = document.positionAt(docText.length - j);

		return TextEdit.replace(new Range(pos0, pos1), newText);
	}
}
