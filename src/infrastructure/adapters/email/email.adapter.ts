import { Injectable, Logger } from '@nestjs/common';
import { IEmailPort } from '../../../core/transfer-bank/application/ports/email.port';

@Injectable()
export class EmailAdapter implements IEmailPort {
  private readonly logger = new Logger(EmailAdapter.name);

  async sendEmail(data: {
    to: string;
    subject: string;
    body: string;
    template?: string;
  }): Promise<void> {
    // Simulate sending email (log it)
    this.logger.log(`📧 Enviando email a: ${data.to}`);
    this.logger.log(`   Asunto: ${data.subject}`);
    this.logger.log(`   Cuerpo: ${data.body}`);
    
    // Simulate delay (real email would take time)
    await this.sleep(2000);
    
    this.logger.log(`✅ Email enviado a: ${data.to}`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}