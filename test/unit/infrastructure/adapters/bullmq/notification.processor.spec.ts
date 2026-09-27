import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Job } from 'bullmq';
import { EMAIL_PORT } from '../../../../../src/core/transfer-bank/application/ports/email.port';
import { NotificationProcessor } from '../../../../../src/infrastructure/adapters/bullmq/notification.processor';

describe('NotificationProcessor', () => {
  let processor: NotificationProcessor;
  let emailPort: { sendEmail: any };
  let moduleRef: TestingModule;

  const job = (data: unknown) => ({ data }) as Job<unknown, unknown, string>;

  beforeEach(async () => {
    emailPort = {
      sendEmail: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined),
    };
    moduleRef = await Test.createTestingModule({
      providers: [
        NotificationProcessor,
        { provide: EMAIL_PORT, useValue: emailPort },
      ],
    }).compile();
    processor = moduleRef.get(NotificationProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should send the notification email and return success', async () => {
    // Arrange
    const data = {
      to: 'user@example.com',
      subject: 'Transfer completed',
      body: 'Your transfer is complete.',
      template: 'transfer-completed',
    };

    // Act
    const result = await processor.process(job(data));

    // Assert
    expect(emailPort.sendEmail).toHaveBeenCalledWith(data);
    expect(result).toEqual({ success: true });
  });

  it('should rethrow email delivery errors', async () => {
    // Arrange
    const error = new Error('Email service unavailable');
    emailPort.sendEmail.mockRejectedValue(error);

    // Act & Assert
    await expect(processor.process(job({
      to: 'user@example.com',
      subject: 'Notice',
      body: 'Body',
    }))).rejects.toBe(error);
  });

  it('should report unknown failures when the email port rejects with a non-error value', async () => {
    // Arrange
    emailPort.sendEmail.mockRejectedValue('unexpected rejection');
    const loggerError = jest.spyOn((processor as any).logger, 'error').mockImplementation(() => undefined);

    // Act & Assert
    await expect(processor.process(job({
      to: 'user@example.com',
      subject: 'Notice',
      body: 'Body',
    }))).rejects.toBe('unexpected rejection');
    expect(loggerError).toHaveBeenCalledWith(expect.stringContaining('Unknown error'));
  });

  it('should log when a notification job completes', () => {
    // Arrange
    const loggerLog = jest.spyOn((processor as any).logger, 'log').mockImplementation(() => undefined);
    const completedJob = { id: 'notification-job-id' } as Job;

    // Act
    processor.onCompleted(completedJob);

    // Assert
    expect(loggerLog).toHaveBeenCalledWith('🎉 Job notification-job-id completado con éxito');
  });

  it('should log the error when a notification job fails', () => {
    // Arrange
    const loggerError = jest.spyOn((processor as any).logger, 'error').mockImplementation(() => undefined);
    const failedJob = { id: 'notification-job-id' } as Job;
    const error = new Error('Email delivery failed');

    // Act
    processor.onFailed(failedJob, error);

    // Assert
    expect(loggerError).toHaveBeenCalledWith('💥 Job notification-job-id falló: Email delivery failed');
  });
});
