import type { Mailer } from '~~/lib/mail/Mailer'

export class ConsoleMailer implements Mailer {
	public async send(to: string, subject: string, text: string): Promise<void> {
		console.log(`[ConsoleMailer] Skipping real send (no SMTP configured). To: ${to}, Subject: ${subject}\n${text}`)
	}
}
