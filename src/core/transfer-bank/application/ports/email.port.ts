export const EMAIL_PORT = 'EMAIL_PORT';

export interface EmailData {
  to: string;
  subject: string;
  body: string;
  template?: string;
}

export interface IEmailPort {
  sendEmail(data: EmailData): Promise<void>;
}
