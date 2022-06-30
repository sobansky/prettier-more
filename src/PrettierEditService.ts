import { Disposable, DocumentFilter, TextDocument, TextEditor, Uri, window, workspace } from 'vscode';
import { getParserFromLanguageId } from './LanguageFilters';
import { LoggingService } from './loggingService';
import { RESTART_TO_ENABLE } from './message';
import { PrettierEditProvider } from './PrettierEditProvider';
import { FormatterStatus, StatusBar } from './StatusBar';
import { ExtensionFormattingOptions, ModuleResolverInterface, PrettierBuiltInParserName, PrettierFileInfoResult, PrettierModule } from './types';
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
	}

	private resetFormatters = async (uri?: Uri) => {
		if (uri) {
			const workspaceFolder = workspace.getWorkspaceFolder(uri);
			//TODO: Uncomment line bellow when completed this class
			//this.registeredWorkspaces.delete(workspaceFolder?.uri.fsPath ?? "global");
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

	private registerDocumentFormatEditorProviders({ languageSelector, rangeLanguageSelector }: ISelectors) {
		this.dispose();

		const editProvider = new PrettierEditProvider(this.provideEdits);
	}

	public dispose = () => {
		this.moduleResolver.dispose();
		//TODO: Uncomment lines bellow after class is complete
		//this.formatterHandler?.dispose();
		//this.rangeFormatterHandler?.dispose();
		this.formatterHandler = undefined;
		this.rangeFormatterHandler = undefined;
	};

	private provideEdits = async (document: TextDocument, options: ExtensionFormattingOptions): Promise<TextEdit[]> => {
		const startTime = new Date().getTime();
		const result = await this.format;
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
		else if (languageId != 'plaintext') {
			this.loggingService.logWarning(`Parser not inferred, trying VS Code language.`);
			const languages = prettierInstance.getSupportInfo().languages;
			parser = getParserFromLanguageId(languages, uri, languageId);
		}
	}
}
