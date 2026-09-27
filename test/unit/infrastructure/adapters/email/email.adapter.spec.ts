import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as nodemailer from 'nodemailer';
import { EmailAdapter } from '../../../../../src/infrastructure/adapters/email/email.adapter';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('EmailAdapter', () => {
  let adapter: EmailAdapter;
  let module: TestingModule;
  let sendMail: jest.Mock<(message: Record<string, unknown>) => Promise<unknown>>;
  const originalEnvironment = { ...process.env };
  const mockCreateTransport = jest.mocked(nodemailer.createTransport);

  beforeEach(async () => {
    process.env = { ...originalEnvironment, NODE_ENV: 'test' };
    sendMail = jest
      .fn<(message: Record<string, unknown>) => Promise<unknown>>()
      .mockResolvedValue(undefined);
    mockCreateTransport.mockReturnValue({ sendMail } as unknown as nodemailer.Transporter);

    module = await Test.createTestingModule({
      providers: [EmailAdapter],
    }).compile();

    adapter = module.get(EmailAdapter);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    process.env = { ...originalEnvironment };
    await module.close();
  });

  it('should create the transporter using configured SMTP settings', () => {
    // Arrange
    process.env.EMAIL_HOST = 'smtp.test.example';
    process.env.EMAIL_PORT = '2525';
    process.env.EMAIL_USER = 'mailer';
    process.env.EMAIL_PASS = 'secret';

    // Act
    const configuredAdapter = new EmailAdapter();

    // Assert
    expect(mockCreateTransport).toHaveBeenLastCalledWith({
      host: 'smtp.test.example',
      port: 2525,
      secure: false,
      auth: { user: 'mailer', pass: 'secret' },
    });
    expect(configuredAdapter).toBeInstanceOf(EmailAdapter);
  });

  it('should use default SMTP settings when environment values are absent', () => {
    // Arrange
    delete process.env.EMAIL_HOST;
    delete process.env.EMAIL_PORT;
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASS;

    // Act
    new EmailAdapter();

    // Assert
    expect(mockCreateTransport).toHaveBeenLastCalledWith({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: '', pass: '' },
    });
  });

  it('should send an email with the configured sender and body as text and HTML', async () => {
    // Arrange
    process.env.EMAIL_FROM = 'notifications@test.example';
    const message = {
      to: 'customer@test.example',
      subject: 'Account update',
      body: 'Your account was updated.',
    };

    // Act
    await adapter.sendEmail(message);

    // Assert
    expect(sendMail).toHaveBeenCalledWith({
      from: 'notifications@test.example',
      to: message.to,
      subject: message.subject,
      text: message.body,
      html: message.body,
    });
  });

  it('should use the default sender when EMAIL_FROM is absent', async () => {
    // Arrange
    delete process.env.EMAIL_FROM;

    // Act
    await adapter.sendEmail({
      to: 'customer@test.example',
      subject: 'Account update',
      body: 'Your account was updated.',
    });

    // Assert
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'noreply@tuapp.com' }),
    );
  });

  it.each([
    ['transfer-completed', 'Transferencia Completada'],
    ['deposit-completed', 'Depósito Completado'],
    ['withdrawal-completed', 'Retiro Completado'],
    ['statement-ready', 'Estado de Cuenta Disponible'],
  ])('should render the %s email template', async (template, heading) => {
    // Arrange
    const body = 'The transaction is complete.';

    // Act
    await adapter.sendEmail({
      to: 'customer@test.example',
      subject: 'Update',
      body,
      template,
    });

    // Assert
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining(heading),
      }),
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ html: expect.stringContaining(body) }),
    );
  });

  it('should render a generic email template for an unknown template name', async () => {
    // Arrange
    const body = 'Your statement is ready.';

    // Act
    await adapter.sendEmail({
      to: 'customer@test.example',
      subject: 'Update',
      body,
      template: 'unknown-template',
    });

    // Assert
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining(`<p>${body}</p>`),
      }),
    );
  });

  it('should skip delivery and log the message in development mode', async () => {
    // Arrange
    process.env.NODE_ENV = 'development';

    // Act
    await adapter.sendEmail({
      to: 'customer@test.example',
      subject: 'Update',
      body: 'Development-only message.',
    });

    // Assert
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('should log and rethrow transporter errors', async () => {
    // Arrange
    const error = new Error('SMTP unavailable');
    sendMail.mockRejectedValue(error);

    // Act & Assert
    await expect(
      adapter.sendEmail({
        to: 'customer@test.example',
        subject: 'Update',
        body: 'Your account was updated.',
      }),
    ).rejects.toBe(error);
  });

  it('should rethrow non-Error transporter failures', async () => {
    // Arrange
    const failure = 'connection reset';
    sendMail.mockRejectedValue(failure);

    // Act & Assert
    await expect(
      adapter.sendEmail({
        to: 'customer@test.example',
        subject: 'Update',
        body: 'Your account was updated.',
      }),
    ).rejects.toBe(failure);
  });
});
