export const OUTDATED_PRETTIER_VERSION_MESSAGE =
	'Your project is configured to use an outdated version of prettier that cannot be used by this extension. Upgrade to the latest version of prettier.';
export const INVALID_PRETTIER_PATH_MESSAGE =
	'`prettierPath` option does not reference a valid instance of Prettier-More. Please ensure you are passing a path to the prettierx module, not the binary. Falling back to bundled version of prettier.';
export const FAILED_TO_LOAD_MODULE_MESSAGE =
	'Failed to load module. If you have prettierx or plugins referenced in package.json, ensure you have run `npm/yarn install`';
export const INVALID_PRETTIER_CONFIG = 'Invalid prettier-more configuration file detected. See log for details.';
export const RESTART_TO_ENABLE = 'To enable or disable prettier-more after changing the `enable` setting, you must restart VS Code.';
export const USING_BUNDLED_PRETTIER = 'Using bundled version of prettier-more.';
export const EXTENSION_DISABLED =
	'Extension is disabled. No formatters will be registered. To enable, change the `prettier-more.enable` to `true` and restart VS Code.';
export const UNTRUSTED_WORKSPACE_USING_BUNDLED_PRETTIER = 'This workspace is not trusted. Using the bundled version of prettier.';
