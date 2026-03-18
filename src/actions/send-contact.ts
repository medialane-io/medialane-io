"use server";

import nodemailer from "nodemailer";

interface SendContactData {
  subject: string;
  name: string;
  email: string;
  message: string;
}

export async function sendContact(data: SendContactData) {
  const { subject, name, email, message } = data;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER,
      to: "dao@medialane.org",
      replyTo: email,
      subject: `[CONTACT] ${subject} - from ${name}`,
      html: `
        <h2>New Contact Message</h2>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${message}</p>
        <hr />
        <p style="color:#888;font-size:12px;">Sent via medialane.io contact form · ${new Date().toUTCString()}</p>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send contact email:", error);
    return { success: false, error: "Failed to send message. Please try again later." };
  }
}
