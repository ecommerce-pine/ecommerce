import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectPinoLogger(EmailService.name) private readonly logger: PinoLogger,
    private readonly configService: ConfigService,
  ) {
    this.createTransporter();
  }

  private createTransporter() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });

    /**
     * Tell typescript that this is a Promise and we decide to ignore the result
     * so that the verification process can run in the background without blocking the constructor.
     */
    void this.verifyConnection();
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      this.logger.info({
        msg: 'email.smtp.connected',
      });
    } catch (error) {
      this.logger.error({
        msg: 'email.smtp.connection_failed',
        error: (error as Error).message,
      });
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: options.from || this.configService.get<string>('SMTP_USER'),
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.info({
        msg: 'email.smtp.sent',
        messageId: info.messageId,
        subject: options.subject,
      });
      return true;
    } catch (error) {
      this.logger.error({
        msg: 'email.smtp.send_failed',
        error: (error as Error).message,
      });
      return false;
    }
  }

  async sendVerificationEmail(
    to: string,
    name: string,
    url: string,
  ): Promise<boolean> {
    const subject = 'Verify your email address';
    const html = `
      <p>Hi ${name},</p>
      <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
      <a href="${url}">Verify Email</a>
      <p>If you did not request this, please ignore this email.</p>
    `;
    return this.sendEmail({ to, subject, html });
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    url: string,
  ): Promise<boolean> {
    const subject = 'Reset your password';
    const html = `
      <p>Hi ${name},</p>
      <p>You requested a password reset. Please click the link below to reset your password:</p>
      <a href="${url}">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
    `;
    return this.sendEmail({ to, subject, html });
  }
}
