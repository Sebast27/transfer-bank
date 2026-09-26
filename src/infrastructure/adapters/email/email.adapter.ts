import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { IEmailPort } from '../../../core/transfer-bank/application/ports/email.port';

@Injectable()
export class EmailAdapter implements IEmailPort {
  private readonly logger = new Logger(EmailAdapter.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
      },
    });
  }

  async sendEmail(data: {
    to: string;
    subject: string;
    body: string;
    template?: string;
  }): Promise<void> {

    // En desarrollo, simular
    if (process.env.NODE_ENV === 'development') {
      this.logger.log(`📧 [DEV] Email simulado a: ${data.to}`);
      this.logger.log(`   Asunto: ${data.subject}`);
      this.logger.log(`   Cuerpo: ${data.body}`);
      return;
    }

    // En producción, enviar real
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@tuapp.com',
        to: data.to,
        subject: data.subject,
        text: data.body,
        html: data.template
          ? this.renderTemplate(data.template, data.body)
          : data.body,
      });

      this.logger.log(`✅ Email enviado a: ${data.to}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Error enviando email a ${data.to}: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Renderiza un template HTML simple
   */
  private renderTemplate(templateName: string, body: string): string {
    const templates: Record<string, string> = {
      'transfer-completed': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">🏦 Banco Digital</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h3 style="color: #27ae60;">✅ Transferencia Completada</h3>
            <p>${body}</p>
          </div>
          <p style="color: #7f8c8d; font-size: 12px;">Este es un mensaje automático, no responder.</p>
        </div>
      `,
      'deposit-completed': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">🏦 Banco Digital</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h3 style="color: #27ae60;">✅ Depósito Completado</h3>
            <p>${body}</p>
          </div>
          <p style="color: #7f8c8d; font-size: 12px;">Este es un mensaje automático, no responder.</p>
        </div>
      `,
      'withdrawal-completed': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">🏦 Banco Digital</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h3 style="color: #e74c3c;">💸 Retiro Completado</h3>
            <p>${body}</p>
          </div>
          <p style="color: #7f8c8d; font-size: 12px;">Este es un mensaje automático, no responder.</p>
        </div>
      `,
      'statement-ready': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">🏦 Banco Digital</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h3 style="color: #3498db;">📄 Estado de Cuenta Disponible</h3>
            <p>${body}</p>
          </div>
          <p style="color: #7f8c8d; font-size: 12px;">Este es un mensaje automático, no responder.</p>
        </div>
      `,
    };

    return templates[templateName] || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">🏦 Banco Digital</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <p>${body}</p>
        </div>
      </div>
    `;
  }
}