import { MailerFactory } from '~~/lib/mail/MailerFactory'

const mailerFactory: MailerFactory = new MailerFactory()

export async function sendNonceCodeEmail(email: string, code: string, ttlMinutes: number): Promise<void> {
	const subject: string = 'Your Shadowcrypt sign-in code'
	const text: string = `Your sign-in code is ${code}. It expires in ${ttlMinutes} minutes. If you did not request this, ignore this email.`
	await mailerFactory.getMailer().send(email, subject, text)
}
