import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

class EmailService {
    constructor() {
        this.transporter = null;
        this.template = null;
        this.initTransporter();
        this.loadTemplate();
    }

    initTransporter() {
        if (process.env.DEBUG_MAIL === 'true') {
            console.log(`[EmailService] Config - Host: ${process.env.EMAIL_HOST}, Port: ${process.env.EMAIL_PORT}`);
        }
        // If no host configured, don't create a transporter (keeps behavior safe in dev)
        if (!process.env.EMAIL_HOST) {
            this.transporter = null;
            return;
        }

        const transportConfig = {
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: false,
        };

        if (process.env.EMAIL_USER) {
            transportConfig.auth = {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            };
        }

        this.transporter = nodemailer.createTransport(transportConfig);
    }

    loadTemplate() {
        try {
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const tplPath = path.join(__dirname, 'email-template.html');
            this.template = fs.readFileSync(tplPath, 'utf8');
        } catch (err) {
            console.error('[EmailService] Could not load email template:', err);
            this.template = null;
        }
    }

    async sendOtpEmail(to, code) {

        if (!to || !code) {
            throw new Error('[EmailService] Missing `to` or `code` for sendOtpEmail');
        }

        // Ensure transporter is configured
        if (!this.transporter) {
            throw new Error('[EmailService] Email transporter not configured.');
        }

        const html = this.template ? this.template.replace('{{CODE}}', String(code)) : `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;"><h2>Verification Code</h2><h1>${code}</h1><p>Expires in 10 minutes.</p></div>`;

        try {
            const info = await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || '"VoteChain" <noreply@votechain.com>',
                to,
                subject: "VoteChain - Codice di accesso",
                text: `Il tuo codice OTP è: ${code}. Scade in 10 minuti.`,
                html,
            });
            console.log("[EmailService] Email sent: %s", info.messageId);
        } catch (error) {
            console.error("[EmailService] Error sending email:", error);
            throw error;
        }
    }
}

// Export ONLY the modern class-based logical instance
const emailService = new EmailService();
export default emailService;
// Named export calling the class method directly for backward compatibility with imports
export const sendEmail = (to, code) => emailService.sendOtpEmail(to, code);

