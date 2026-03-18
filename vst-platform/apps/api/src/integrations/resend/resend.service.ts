import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

interface SendParams {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class ResendService {
  private readonly client: Resend | null = null;
  private readonly from: string;
  private readonly logger = new Logger(ResendService.name);

  constructor() {
    const key  = process.env.RESEND_API_KEY;
    this.from  = process.env.EMAIL_FROM ?? 'noreply@voyagesmarttravel.com';

    if (key) {
      this.client = new Resend(key);
      this.logger.log('Resend client initialised');
    } else {
      this.logger.warn('RESEND_API_KEY missing — email delivery DISABLED');
    }
  }

  /**
   * Send a transactional email. Returns true on success.
   * Never throws — caller handles failure via returned boolean.
   */
  async send({ to, subject, html }: SendParams): Promise<boolean> {
    if (!this.client) {
      this.logger.warn(`[EMAIL STUB] to=${to} | ${subject}`);
      return false;
    }
    try {
      const { error } = await this.client.emails.send({
        from: this.from,
        to,
        subject,
        html,
      });
      if (error) {
        this.logger.error(`Email failed to ${to}: ${error.message}`);
        return false;
      }
      this.logger.log(`Email sent to=${to} subject="${subject}"`);
      return true;
    } catch (err: any) {
      this.logger.error(`Email exception to ${to}: ${err.message}`);
      return false;
    }
  }
}
