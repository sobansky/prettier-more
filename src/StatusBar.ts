import { StatusBarAlignment, StatusBarItem, ThemeColor, window } from 'vscode';

export enum FormatterStatus {
	Ready = 'check-all',
	Success = 'check',
	Ignore = 'x',
	Warn = 'warning',
	Error = 'alert',
	Disabled = 'circle-slash'
}

export class StatusBar {
	private statusBarItem: StatusBarItem;

	constructor() {
		this.statusBarItem = window.createStatusBarItem('prettier-more.status', StatusBarAlignment.Right, -1);

		this.statusBarItem.name = 'Prettier-More';
		this.statusBarItem.text = 'Prettier-More';
		this.statusBarItem.command = 'prettier-more.openOutput';
		this.update(FormatterStatus.Ready);
		this.statusBarItem.show();
	}

	public update(result: FormatterStatus): void {
		this.statusBarItem.text = `$(${result.toString()}) Prettier-More`;

		if (result === FormatterStatus.Error) {
			this.statusBarItem.backgroundColor = new ThemeColor('statusBarItem.errorBackground');
		}
		else {
			this.statusBarItem.backgroundColor = new ThemeColor('statusBarItem.foregroundBackground');
		}

		this.statusBarItem.show();
	}

	public hide() {
		this.statusBarItem.hide();
	}
}
