import { execSync } from 'child_process';
// import * as prettier from 'prettier';
import * as findUp from 'find-up';
import * as fs from 'fs';
import * as path from 'path';
import * as resolve from 'resolve';
import * as semver from 'semver';
import { commands, TextDocument, Uri, workspace } from 'vscode';
import { resolveGlobalNodePath, resolveGlobalYarnPath } from './Files';
import { LoggingService } from './loggingService';
import {
	FAILED_TO_LOAD_MODULE_MESSAGE,
	INVALID_PRETTIER_PATH_MESSAGE,
	OUTDATED_PRETTIER_VERSION_MESSAGE,
	UNTRUSTED_WORKSPACE_USING_BUNDLED_PRETTIER,
	USING_BUNDLED_PRETTIER
} from './message';
import { ModuleResolverInterface, PackageManagers, PrettierModule, PrettierOptions, PrettierResolveConfigOptions, PrettierVSCodeConfig } from './types';
import { getConfig, getWorkspaceRelativePath } from './util';

var prettier = require('prettier-m');
const prettierName = 'prettier-m';

//const resolve = require['resolve'];

const minPrettierVersion = '0.1.1';
declare const __webpack_require__: typeof require;
declare const __non_webpack_require__: typeof require;

export type PrettierNodeModule = typeof prettier;

const globalPaths: {
	[key: string]: { cache: string | undefined; get(): string | undefined };
} = {
	npm: {
		cache: undefined,
		get(): string | undefined {
			return resolveGlobalNodePath();
		}
	},
	pnpm: {
		cache: undefined,
		get(): string {
			const pnpmPath = execSync('pnpm root -g').toString().trim();
			return pnpmPath;
		}
	},
	yarn: {
		cache: undefined,
		get(): string | undefined {
			return resolveGlobalYarnPath();
		}
	}
};

function globalPathGet(packageManager: PackageManagers): string | undefined {
	const pm = globalPaths[packageManager];
	if (pm) {
		if (pm.cache === undefined) {
			pm.cache = pm.get();
		}
		return pm.cache;
	}
	return undefined;
}

export class ModuleResolver implements ModuleResolverInterface {
	private findPkgCache: Map<string, string>;
	private ignorePathCache = new Map<string, string>();
	private path2Module = new Map<string, PrettierNodeModule>();

	constructor(private loggingService: LoggingService) {
		this.findPkgCache = new Map();
	}

	public getGlobalPrettierInstance(): PrettierNodeModule {
		return prettier;
	}

	/**
   * Returns an instance of the prettier module.
   * @param fileName The path of the file to use as the starting point. If none provided, the bundled prettier will be used.
   */
	public async getPrettierInstance(fileName: string): Promise<PrettierModule | undefined> {
		if (!workspace.isTrusted) {
			this.loggingService.logDebug(UNTRUSTED_WORKSPACE_USING_BUNDLED_PRETTIER);
			return prettier;
		}

		const { prettierPath, resolveGlobalModules } = getConfig(Uri.file(fileName));

		let modulePath: string | undefined = undefined;

		try {
			modulePath = prettierPath ? getWorkspaceRelativePath(fileName, prettierPath) : this.findPkg(fileName, prettierName);
		} catch (error) {
			let moduleDirectory = '';
			if (!modulePath && error instanceof Error) {
				const resolveSyncPathRegex = /Cannot find module '.*' from '(.*)'/;
				const resolveErrorMatches = resolveSyncPathRegex.exec(error.message);
				if (resolveErrorMatches && resolveErrorMatches[1]) {
					moduleDirectory = resolveErrorMatches[1];
				}
			}

			this.loggingService.logInfo(`Attempted to determine module path from ${modulePath || moduleDirectory || 'package.json'}`);

			this.loggingService.logError(FAILED_TO_LOAD_MODULE_MESSAGE, error);

			// Return here because there is a local module, but we can't resolve it.
			// Must do NPM install for prettierx to work.
			return undefined;
		}

		// If global modules allowed, look for global module
		if (resolveGlobalModules && !modulePath) {
			const packageManager = (await commands.executeCommand<'npm' | 'pnpm' | 'yarn'>('npm.packageManager'))!;

			const resolvedGlobalPackageManagerPath = globalPathGet(packageManager);
			if (resolvedGlobalPackageManagerPath) {
				const globalModulePath = path.join(resolvedGlobalPackageManagerPath, prettierName);
				if (fs.existsSync(globalModulePath)) {
					modulePath = globalModulePath;
				}
			}
		}

		let moduleInstance: PrettierNodeModule | undefined = undefined;
		if (modulePath !== undefined) {
			this.loggingService.logDebug(`Local prettier module path: '${modulePath}'`);

			moduleInstance = this.path2Module.get(modulePath);
			if (moduleInstance) {
				return moduleInstance;
			}
			else {
				try {
					moduleInstance = this.loadNodeModule<PrettierNodeModule>(modulePath);
					if (moduleInstance) {
						this.path2Module.set(modulePath, moduleInstance);
					}
				} catch (error) {
					this.loggingService.logInfo(`Attempted to load Prettier module from ${modulePath || 'package.json'}`);

					this.loggingService.logError(FAILED_TO_LOAD_MODULE_MESSAGE, error);

					return undefined;
				}
			}
		}

		if (moduleInstance) {
			// If the instance is missing `format`, it's probably
			// not an instance of Prettier
			const isPrettierInstance = !!moduleInstance.format;
			const isValidVersion =
				moduleInstance.version &&
				!!moduleInstance.getSupportInfo &&
				!!moduleInstance.getFileInfo &&
				!!moduleInstance.resolveConfig &&
				semver.gte(moduleInstance.version, minPrettierVersion);

			if (!isPrettierInstance && prettierPath) {
				this.loggingService.logError(INVALID_PRETTIER_PATH_MESSAGE);
				return undefined;
			}

			if (!isValidVersion) {
				this.loggingService.logInfo(`Attempted to load Prettier module from ${modulePath}`);

				this.loggingService.logError(OUTDATED_PRETTIER_VERSION_MESSAGE);
				return undefined;
			}
			else {
				this.loggingService.logDebug(`Using prettier version ${moduleInstance.version}`);
			}

			return moduleInstance;
		}
		else {
			this.loggingService.logDebug(USING_BUNDLED_PRETTIER);
			return prettier;
		}
	}

	public async getResolvedIgnorePath(fileName: string, ignorePath: string): Promise<string | undefined> {
		const cacheKey = `${fileName}:${ignorePath}`;

		let resolvedIgnorePath = this.ignorePathCache.get(cacheKey);
		if (!resolvedIgnorePath) {
			resolvedIgnorePath = getWorkspaceRelativePath(fileName, ignorePath);

			if (workspace.workspaceFolders) {
				const folders = workspace.workspaceFolders
					.map(folder => folder.uri.fsPath)
					.filter(folder => {
						// https://stackoverflow.com/a/45242825
						const relative = path.relative(folder, fileName);
						return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
					})
					.sort((a, b) => b.length - a.length); // sort folders innermost to outermost

				for (const folder of folders) {
					const p = path.join(folder, ignorePath);

					if (await fs.promises.stat(p).then(() => true, () => false)) {
						resolvedIgnorePath = p;
						break;
					}
				}
			}
		}

		if (resolvedIgnorePath) {
			this.ignorePathCache.set(cacheKey, resolvedIgnorePath);
		}

		return resolvedIgnorePath;
	}

	public async getResolvedConfig(
		{ fileName, uri }: TextDocument,
		vscodeConfig: PrettierVSCodeConfig
	): Promise<'error' | 'disabled' | PrettierOptions | null> {
        const isVirtual = uri.scheme  !== "file";
        let configPath:string|undefined;

        try {
            if (!isVirtual) {
                configPath = (await prettier.resolveConfigFile(fileName)) ?? undefined;
            }
        } catch (error) {
            this.loggingService.logError(`Error resolving prettier configuration for ${fileName}`, error);

            return "error";
        }

        const resolveConfigOptions: PrettierResolveConfigOptions = {
            config: isVirtual
            ? undefined
            : vscodeConfig.configPath
            ? getWorkspaceRelativePath(fileName, vscodeConfig.configPath)
            : configPath,
            editorconfig: isVirtual ? undefined : vscodeConfig.useEditorConfig
        };

        let resolvedConfig: PrettierOptions | null;
        try {
            resolvedConfig = isVirtual ? null : await prettier.resolveConfig(fileName, resolveConfigOptions);
        } catch (error) {
            this.loggingService.logError("Invalid prettier configuration file detected.", error);

            this.loggingService.logError(INVALID_PRETTIER_PATH_MESSAGE);

            return "error";
        }

        if (resolveConfigOptions.config) {
            this.loggingService.logInfo(`Using config file at '${resolveConfigOptions.config}'`);
        }

        if (!isVirtual && !resolvedConfig && vscodeConfig.requireConfig) {
            this.loggingService.logInfo("Require config set to true and no config present. Skipping file.");

            return "disabled";
        }

        return resolvedConfig;
    }

    /**
   * Clears the module and config cache
   */
  public async dispose() {
    prettier.clearConfigCache();
    this.path2Module.forEach((module) => {
      try {
        module.clearConfigCache();
      } catch (error) {
        this.loggingService.logError("Error clearing module cache.", error);
      }
    });
    this.path2Module.clear();
  }

	private findPkg(fsPath: string, pkgName: string): string | undefined {
		const cacheKey = `${fsPath}:${pkgName}`;
		const packagePathState = this.findPkgCache.get(cacheKey);

		if (packagePathState) {
			return packagePathState;
		}

		// Only look for a module definition outside of any `node_modules` directories
		const splitPath = fsPath.split('/');
		let finalPath = fsPath;
		const nodeModulesIndex = splitPath.indexOf('node_modules');

		if (nodeModulesIndex > 1) {
			finalPath = splitPath.slice(0, nodeModulesIndex).join('/');
		}

		// First look for an explicit package.json dep
		const packageJsonResDir = findUp.sync(
			(dir): string | undefined => {
				if (fs.existsSync(path.join(dir, 'package.json'))) {
					let packageJson;
					try {
						packageJson = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
					} catch (error) {
						// Swallow, if we can't read it we don't want to resolve based on it
					}
					if (
						packageJson &&
						((packageJson.dependencies && packageJson.dependencies[pkgName]) ||
							(packageJson.devDependencies && packageJson.devDependencies[pkgName]))
					) {
						return dir;
					}
				}
			},
			{ cwd: finalPath, type: 'directory' }
		);

		if (packageJsonResDir) {
			const packagePath = resolve.sync(pkgName, { basedir: packageJsonResDir });
			this.findPkgCache.set(cacheKey, packagePath);
			return packagePath;
		}

		// If no explicit package.json dep found, instead look for implicit dep
		const nodeModulesResDir = findUp.sync(
			(dir): string | undefined => {
				if (fs.existsSync(path.join(dir, 'node_modules', pkgName))) {
					return dir;
				}
			},
			{ cwd: finalPath, type: 'directory' }
		);

		if (nodeModulesResDir) {
			const packagePath = resolve.sync(pkgName, { basedir: nodeModulesResDir });
			this.findPkgCache.set(cacheKey, packagePath);
			return packagePath;
		}

		return;
	}

	// Source: https://github.com/microsoft/vscode-eslint/blob/master/server/src/eslintServer.ts
	private loadNodeModule<T>(moduleName: string): T | undefined {
		const req = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require;

		try {
			return req(moduleName);
		} catch (error) {
			this.loggingService.logError(`Error loading node module '${moduleName}'`, error);
		}

		return undefined;
	}
}
