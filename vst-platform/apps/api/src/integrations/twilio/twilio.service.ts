import { Injectable, Logger } from '@nestjs/common';
import twilio from 'twilio';

@Injectable()
export class TwilioService {
  private readonly client: ReturnType<typeof twilio> | null = null;
  private readonly from: string;
  private readonly logger = new Logger(TwilioService.name);

  constructor() {
    const sid   = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    this.from   = process.env.TWILIO_FROM_NUMBER ?? '';

    if (sid && token && this.from) {
      this.client = twilio(sid, token);
      this.logger.log('Twilio client initialised');
    } else {
      this.logger.warn('Twilio credentials missing — SMS delivery DISABLED');
    }
  }

  /**
   * Send a single SMS. Returns true on success, false on failure.
   * Never throws — caller decides how to handle delivery failure.
   */
  async sendSms(to: string, body: string): Promise<boolean> {
    if (!this.client) {
      this.logger.warn(`[SMS STUB] to=${to} | ${body.slice(0, 80)}`);
      return false;
    }
    try {
      const msg = await this.client.messages.create({ to, from: this.from, body });
      this.logger.log(`SMS sent sid=${msg.sid} to=${to}`);
      return true;
    } catch (err: any) {
      this.logger.error(`SMS failed to ${to}: ${err.message}`);
      return false;
    }
  }

  /**
   * Send to multiple recipients. Returns count of successful deliveries.
   */
  async sendBulkSms(recipients: string[], body: string): Promise<number> {
    const results = await Promise.all(recipients.map(r => this.sendSms(r, body)));
    return results.filter(Boolean).length;
  }
}
