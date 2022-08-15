import { TextDocument } from 'vscode';
import { LoggingService } from './loggingService';
import {
  PrettierFileInfoOptions,
  PrettierFileInfoResult,
  ModuleResolverInterface,
  PrettierModule,
  PrettierOptions,
  PrettierSupportLanguage,
  PrettierVSCodeConfig
} from './types';
import { getWorkspaceRelativePath } from './util';

const prettierStandalone = require("prettier-m/standalone");
const angularPlugin = require('prettier-m/parser-angular');
const babelPlugin = require('prettier-m/parser-babel');
const glimmerPlugin = require('prettier-m/parser-glimmer');
const graphqlPlugin = require('prettier-m/parser-graphql');
const htmlPlugin = require('prettier-m/parser-html');
const markdownPlugin = require('prettier-m/parser-markdown');
const meriyahPlugin = require('prettier-m/parser-meriyah');
const typescriptPlugin = require('prettier-m/parser-typescript');
const yamlPlugin = require('prettier-m/parser-yaml');

const plugins = [
  angularPlugin,
  babelPlugin,
  glimmerPlugin,
  graphqlPlugin,
  htmlPlugin,
  markdownPlugin,
  meriyahPlugin,
  typescriptPlugin,
  yamlPlugin,
]

export class ModuleResolver implements ModuleResolverInterface{
  constructor(private loggingService: LoggingService) {}

  public async getPrettierInstance(fileName: string): Promise<PrettierModule | undefined> {
    return this.getGlobalPrettierInstance();
  }

  public async getResolvedIgnorePath(fileName: string, ignorePath:string):Promise<string | undefined>{
    return getWorkspaceRelativePath(fileName, ignorePath);
  }

  public getGlobalPrettierInstance(): PrettierModule {
    this.loggingService.logInfo("Using standalone prettier-more");

    return {
      format: (source: string, options: PrettierOptions) => {
        return prettierStandalone.format(source, {...options, plugins});
      },
      getSupportInfo: (): {languages: PrettierSupportLanguage[]} => {
        return {
          languages: [
            {
              vscodeLanguageIds: [
                "javascript",
                "javascriptreact",
                "mongo",
                "mongodb",
              ],
              extensions: [],
              parsers: [
                "babel",
                "espree",
                "meriyah",
                "babel-flow",
                "babel-ts",
                "flow",
                "typescript",
              ],
            },
            {
              vscodeLanguageIds: ["typescript"],
              extensions: [],
              parsers: ["typescript", "babel-ts"],
            },
            {
              vscodeLanguageIds: ["typescriptreact"],
              extensions: [],
              parsers: ["typescript", "babel-ts"],
            },
            {
              vscodeLanguageIds: ["json"],
              extensions: [],
              parsers: ["json-stringify"],
            },
            {
              vscodeLanguageIds: ["json"],
              extensions: [],
              parsers: ["json"],
            },
            {
              vscodeLanguageIds: ["jsonc"],
              parsers: ["json"],
            },
            {
              vscodeLanguageIds: ["json5"],
              extensions: [],
              parsers: ["json5"],
            },
            {
              vscodeLanguageIds: ["handlebars"],
              extensions: [],
              parsers: ["glimmer"],
            },
            {
              vscodeLanguageIds: ["graphql"],
              extensions: [],
              parsers: ["graphql"],
            },
            {
              vscodeLanguageIds: ["markdown"],
              parsers: ["markdown"],
            },
            {
              vscodeLanguageIds: ["mdx"],
              extensions: [],
              parsers: ["mdx"],
            },
            {
              vscodeLanguageIds: ["html"],
              extensions: [],
              parsers: ["angular"],
            },
            {
              vscodeLanguageIds: ["html"],
              extensions: [],
              parsers: ["html"],
            },
            {
              vscodeLanguageIds: ["html"],
              extensions: [],
              parsers: ["lwc"],
            },
            {
              vscodeLanguageIds: ["vue"],
              extensions: [],
              parsers: ["vue"],
            },
            {
              vscodeLanguageIds: ["yaml", "ansible", "home-assistant"],
              extensions: [],
              parsers: ["yaml"],
            },
          ],
        };
      },
      getFileInfo: async (filePath: string, options?: PrettierFileInfoOptions):Promise<PrettierFileInfoResult> => {
        return {ignored: false, inferredParser: null};
      },
    };
  }

  async getResolvedConfig(doc: TextDocument, vscodeConfig: PrettierVSCodeConfig): Promise<'error' | 'disabled' | PrettierOptions | null> {
    return null;
  }

  dispose(): void {
    
  }
}