import { spawn } from "node:child_process"
import { watch } from "node:fs"

const watchedDirs = ["zig-src", "."]
const watchedFiles = new Set(["build.zig"])
let running = false
let queued = false
let debounceTimer: ReturnType<typeof setTimeout> | undefined

function build() {
	if (running) {
		queued = true
		return
	}

	running = true
	const child = spawn("npm", ["run", "build:zig"], {
		stdio: "inherit",
		shell: process.platform === "win32",
	})

	child.on("exit", (code) => {
		running = false
		if (code !== 0) {
			console.error(`build:zig exited with code ${code ?? "unknown"}`)
		}
		if (queued) {
			queued = false
			build()
		}
	})
}

function scheduleBuild() {
	clearTimeout(debounceTimer)
	debounceTimer = setTimeout(build, 100)
}

for (const dir of watchedDirs) {
	watch(dir, { recursive: true }, (_eventType, filename) => {
		if (!filename) return
		if (dir === "." && !watchedFiles.has(filename)) return
		if (dir === "zig-src" && !filename.endsWith(".zig")) return
		scheduleBuild()
	})
}

console.log("Watching Zig sources for changes...")
build()
