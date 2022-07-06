import {
	CancellationToken,
	DocumentFormattingEditProvider,
	DocumentRangeFormattingEditProvider,
	FormattingOptions,
	ProviderResult,
	Range,
	TextDocument,
	TextEdit
} from 'vscode';
import { ExtensionFormattingOptions } from './types';

export class PrettierEditProvider implements DocumentRangeFormattingEditProvider, DocumentFormattingEditProvider {
	constructor(private provideEdits: (document: TextDocument, options: ExtensionFormattingOptions) => Promise<TextEdit[]>) {}

	public provideDocumentRangeFormattingEdits(
		document: TextDocument,
		range: Range,
		options: FormattingOptions,
		token: CancellationToken
	): Promise<TextEdit[]> {
		return this.provideEdits(document, {
			rangeEnd: document.offsetAt(range.end),
			rangeStart: document.offsetAt(range.start),
			force: false
		});
	}

	public provideDocumentFormattingEdits(document: TextDocument, options: FormattingOptions, token: CancellationToken): ProviderResult<TextEdit[]> {
		return this.provideEdits(document, {
			force: false
		});
	}
}
