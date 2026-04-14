type ZigConsoleLevel = 'debug' | 'info' | 'warn' | 'error'

const decoder = new TextDecoder()

function readMemoryString(memory: WebAssembly.Memory | null, ptr: number, len: number): string {
	if (memory === null) {
		return '<zig log before memory was attached>'
	}
	return decoder.decode(new Uint8Array(memory.buffer, ptr, len))
}

function writeConsoleLine(prefix: string, level: ZigConsoleLevel, message: string): void {
	const line = `${prefix} ${message}`
	switch (level) {
		case 'debug':
			console.debug(line)
			return
		case 'info':
			console.log(line)
			return
		case 'warn':
			console.warn(line)
			return
		case 'error':
			console.error(line)
	}
}

export function createZigImportObject(prefix: string): {
	imports: {
		env: {
			zigLogDebug: (ptr: number, len: number) => void
			zigLogInfo: (ptr: number, len: number) => void
			zigLogWarn: (ptr: number, len: number) => void
			zigLogError: (ptr: number, len: number) => void
		}
	}
	setMemory: (memory: WebAssembly.Memory) => void
} {
	let memory: WebAssembly.Memory | null = null

	const makeLogger = (level: ZigConsoleLevel) => {
		return (ptr: number, len: number): void => {
			writeConsoleLine(prefix, level, readMemoryString(memory, ptr, len))
		}
	}

	return {
		imports: {
			env: {
				zigLogDebug: makeLogger('debug'),
				zigLogInfo: makeLogger('info'),
				zigLogWarn: makeLogger('warn'),
				zigLogError: makeLogger('error'),
			},
		},
		setMemory(nextMemory: WebAssembly.Memory): void {
			memory = nextMemory
		},
	}
}
