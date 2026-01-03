import * as nodemailer from "nodemailer";
import { renderTemplate, EmailTemplateName } from "./render-template";

type SendEmailInput = {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    template?: EmailTemplateName;
    data?: Record<string, unknown>;
};

export const sendEmail = async ({
    to,
    subject,
    text,
    html,
    template,
    data,
}: SendEmailInput): Promise<void> => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    if (!fromAddress) {
        throw new Error("EMAIL_FROM or EMAIL_USER must be set");
    }

    let resolvedHtml = html;
    let resolvedText = text;

    if (template) {
        resolvedHtml = renderTemplate({ template, data });
        if (!resolvedText && resolvedHtml) {
            resolvedText = resolvedHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        }
    }

    await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text: resolvedText,
        html: resolvedHtml,
    });
};