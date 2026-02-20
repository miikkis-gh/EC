type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
	level: LogLevel;
	module: string;
	message: string;
	data?: Record<string, unknown>;
}

function formatEntry(entry: LogEntry): string {
	const timestamp = new Date().toISOString();
	const base = `${timestamp} [${entry.level.toUpperCase()}] [${entry.module}] ${entry.message}`;

	if (entry.data && Object.keys(entry.data).length > 0) {
		return `${base} ${JSON.stringify(entry.data)}`;
	}

	return base;
}

function extractError(err: unknown): string | undefined {
	if (err instanceof Error) return err.message;
	if (typeof err === 'string') return err;
	return undefined;
}

export function createLogger(module: string) {
	return {
		info(message: string, data?: Record<string, unknown>) {
			console.log(formatEntry({ level: 'info', module, message, data }));
		},
		warn(message: string, data?: Record<string, unknown>) {
			console.warn(formatEntry({ level: 'warn', module, message, data }));
		},
		error(message: string, error?: unknown, data?: Record<string, unknown>) {
			const errorMessage = extractError(error);
			console.error(
				formatEntry({
					level: 'error',
					module,
					message: errorMessage ? `${message}: ${errorMessage}` : message,
					data
				})
			);
		}
	};
}
