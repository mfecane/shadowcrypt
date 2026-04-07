export class LogPanel {
	private debugPanel: HTMLDivElement | null = null

	private debugLines: string[] = []

	public constructor(private readonly enabled: boolean) {
		if (!this.enabled) return
		this.debugPanel = document.createElement('div')
		this.debugPanel.id = 'debug-overlay'
		this.debugPanel.setAttribute('debug-overlay', 'true')
		this.debugPanel.style.position = 'absolute'
		this.debugPanel.style.top = '8px'
		this.debugPanel.style.left = '8px'
		this.debugPanel.style.maxWidth = 'min(420px, calc(100% - 16px))'
		this.debugPanel.style.maxHeight = '60vh'
		this.debugPanel.style.overflow = 'auto'
		this.debugPanel.style.padding = '8px 10px'
		this.debugPanel.style.borderRadius = '8px'
		this.debugPanel.style.background = 'rgba(0, 0, 0, 0.82)'
		this.debugPanel.style.color = '#d7f9d1'
		this.debugPanel.style.font = '12px/1.4 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
		this.debugPanel.style.whiteSpace = 'pre-wrap'
		this.debugPanel.style.wordBreak = 'break-word'
		this.debugPanel.style.pointerEvents = 'none'
		this.debugPanel.style.zIndex = '60'
		this.debugPanel.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.35)'
		document.body.appendChild(this.debugPanel)
	}

	public log(message: string): void {
		if (!this.enabled || !this.debugPanel) return
		const timestamp = new Date().toISOString().slice(11, 23)
		const line = `[${timestamp}] ${message}`
		this.debugLines.push(line)
		if (this.debugLines.length > 80) {
			this.debugLines = this.debugLines.slice(-80)
		}
		this.debugPanel.textContent = this.debugLines.join('\n')
		this.debugPanel.scrollTop = this.debugPanel.scrollHeight
	}
}
