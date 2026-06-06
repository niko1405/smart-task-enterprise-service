jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    verify: jest.fn(),
    sendMail: jest.fn(),
  })),
}));

import nodemailer from 'nodemailer';
import { emailService } from '../src/services/email.service';

const getMockTransporter = () =>
  (nodemailer.createTransport as jest.Mock).mock.results[0]?.value as {
    verify: jest.Mock;
    sendMail: jest.Mock;
  };

const baseTask = {
  id: 'task-uuid-1',
  title: 'Test Task',
  status: 'DONE',
  createdBy: { email: 'creator@test.com', name: 'Creator' },
  assignedTo: null as { email: string; name: string } | null,
};

describe('EmailService', () => {
  let mockTransporter: ReturnType<typeof getMockTransporter>;

  beforeAll(() => {
    mockTransporter = getMockTransporter();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyConnection', () => {
    it('should return true when SMTP server is reachable', async () => {
      mockTransporter.verify.mockResolvedValue(true);
      const result = await emailService.verifyConnection();
      expect(result).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalledTimes(1);
    });

    it('should return false when SMTP server is unreachable', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection refused'));
      const result = await emailService.verifyConnection();
      expect(result).toBe(false);
    });
  });

  describe('sendTaskCompletionEmail', () => {
    it('should send email to assignee when task is assigned', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-1' });
      const task = { ...baseTask, assignedTo: { email: 'assignee@test.com', name: 'Assignee' } };

      await emailService.sendTaskCompletionEmail(task);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'assignee@test.com' })
      );
    });

    it('should send email to creator when task has no assignee', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-2' });
      const task = { ...baseTask, assignedTo: null };

      await emailService.sendTaskCompletionEmail(task);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'creator@test.com' })
      );
    });

    it('should include task title in subject', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-3' });

      await emailService.sendTaskCompletionEmail(baseTask);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('Test Task'),
        })
      );
    });

    it('should not throw when sendMail fails (non-critical)', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

      await expect(emailService.sendTaskCompletionEmail(baseTask)).resolves.toBeUndefined();
    });
  });
});
