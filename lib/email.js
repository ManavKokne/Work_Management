import "server-only";
import nodemailer from "nodemailer";

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

export async function sendTaskCreatedEmail({
  recipient,
  taskId,
  customerName,
  address,
  reportedBy,
  engineerName,
  reportedTime,
}) {
  const transporter = getTransporter();

  if (!transporter || !recipient) {
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: recipient,
    subject: `Task Assigned: #${taskId}`,
    text: [
      `Task ID: ${taskId}`,
      `Customer Name: ${customerName}`,
      `Address: ${address}`,
      `Reported By: ${reportedBy}`,
      `Engineer Name: ${engineerName}`,
      `Reported Time: ${reportedTime}`,
    ].join("\n"),
  });
}
