export const EMAIL_PORT = 'EMAIL_PORT';

export interface IEmailPort {
  sendEmail(data: {
    to: string;
    subject: string;
    body: string;
    template?: string;
  }): Promise<void>;
}