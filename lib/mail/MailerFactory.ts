import { ConsoleMailer } from '~~/lib/mail/ConsoleMailer'
import type { Mailer } from '~~/lib/mail/Mailer'
import { NodemailerSmtpMailer } from '~~/lib/mail/NodemailerSmtpMailer'
import { ResendMailer } from '~~/lib/mail/ResendMailer'

export class MailerFactory {
	private mailer: Mailer | null = null

	public getMailer(): Mailer {
		if (this.mailer !== null) {
			return this.mailer
		}
		this.mailer = this.createMailer()
		return this.mailer
	}

	private createMailer(): Mailer {
		if (process.env.NODE_ENV === 'production') {
			return new ResendMailer()
		}
		if (process.env.SMTP_ENABLED === 'true') {
			return new NodemailerSmtpMailer()
		}
		return new ConsoleMailer()
	}
}
