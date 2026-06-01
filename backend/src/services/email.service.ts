import nodemailer from 'nodemailer';
import { env } from '../config/env';

interface TaskWithRelations {
  id: string;
  title: string;
  status: string;
  assignedTo: {
    email: string;
    name: string;
  } | null;
  createdBy: {
    email: string;
    name: string;
  };
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: env.SMTP_USER && env.SMTP_PASSWORD ? {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      } : undefined,
      secure: false,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendTaskCompletionEmail(task: TaskWithRelations): Promise<void> {
    const recipient = task.assignedTo || task.createdBy;

    if (!recipient) {
      console.warn('No recipient found for task completion email');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .task-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
          .status-badge { display: inline-block; background: #10b981; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; }
          .footer { margin-top: 20px; font-size: 12px; color: #6b7280; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Task Completed!</h1>
          </div>
          <div class="content">
            <p>Hello ${recipient.name},</p>
            <p>A task has been marked as completed:</p>
            <div class="task-title">${task.title}</div>
            <p>Status: <span class="status-badge">DONE</span></p>
            <p>Task ID: ${task.id}</p>
            <div class="footer">
              <p>This is an automated notification from Smart Task Enterprise Service</p>
              <p>View in Mailpit: <a href="http://localhost:8025">http://localhost:8025</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: env.EMAIL_FROM,
        to: recipient.email,
        subject: `✅ Task Completed: ${task.title}`,
        html: htmlContent,
      });

      console.log(`📧 Task completion email sent to ${recipient.email}`);
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      // Don't throw error - email failure shouldn't break the task update
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email server connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email server connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
