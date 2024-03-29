import { window } from 'vscode';

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'NONE';

export class LoggingService {
	private outputChannel = window.createOutputChannel('prettier-more');

	private logLevel: LogLevel = 'INFO';

	public setOutputLevel(logLevel: LogLevel) {
		this.logLevel = logLevel;
	}

	public logDebug(message: string, data?: unknown) {
		if (this.logLevel !== 'DEBUG') {
			return;
		}

		this.logMessage(message, 'DEBUG');

		if (data) {
			this.logObject(data);
		}
	}

	public logInfo(message: string, data?: unknown) {
		if (this.logLevel !== 'INFO') {
			return;
		}

		this.logMessage(message, 'INFO');

		if (data) {
			this.logObject(data);
		}
	}

	public logWarning(message: string, data?: unknown) {
		if (this.logLevel !== 'WARN') {
			return;
		}

		this.logMessage(message, 'WARN');

		if (data) {
			this.logObject(data);
		}
	}

	public logError(message: string, error?: unknown) {
		if (this.logLevel !== 'ERROR') {
			return;
		}

		this.logMessage(message, 'WARN');

        if (typeof error === "string") {
            this.outputChannel.appendLine(error);
        }
        else if (error instanceof Error) {
            if (error?.message) {
                this.logMessage(error.message, "ERROR");
            }
            if (error?.stack) {
                this.outputChannel.appendLine(error.stack);
            }
        }
        else if (error) {
            this.logObject(error);
        }		
	}

	public show() {
		this.outputChannel.show();
	}
	
	private logMessage(message: string, logLevel: LogLevel) {
		const localDate = new Date().toLocaleDateString();
		this.outputChannel.appendLine(`["${logLevel}" - ${localDate}] ${message}`);
	}

	private logObject(data: unknown) {
		const message = JSON.stringify(data, null, 2);

		this.outputChannel.appendLine(message);
	}
}
