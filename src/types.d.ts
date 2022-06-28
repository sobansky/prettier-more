import * as prettier from 'prettier';

interface IExtensionConfig {
	/**
     * Path to '.prettierignore' or similar.
     */
	ignorePath: string;
	/**
     * Path to prettier module.
     */
	prettierPath: string | undefined;
	/**
     * Path to prettier configuration file.
     */
	configPath: string | undefined;
	/**
     * If true will skip formatting if a prettier config isn't found.
     */
	requireConfig: boolean;
	/**
     * If true, take into account the .editorconfig file when resolving configuration.
     */
	useEditorConfig: boolean;
	/**
     * If true, this extension will attempt to use global npm or yarn modules.
     */
	resolveGlobalModules: boolean;
	/**
     * If true, this extension will process files in node_modules
     */
	withNodeModules: boolean;
	/**
     * Additional file patterns to register for formatting
     */
	documentSelectors: string[];
	/**
     * If true, this extension will be enabled
     */
	enable: boolean;
	/**
     * If true, enabled debug logs
     */
	enableDebugLogs: boolean;
}
//TODO: Necessary to add next configuration/options/properties
export type PrettierVSCodeConfig = IExtensionConfig & prettier.Options;
