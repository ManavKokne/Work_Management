import "server-only";
import nodemailer from "nodemailer";

function buildRecipientList(...groups) {
  const entries = groups
    .flat()
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return [...new Set(entries)];
}

function getAdminEmails() {
  return String(process.env.ADMIN_NOTIFICATION_EMAILS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

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
  recipients,
  taskId,
  customerName,
  address,
  reportedBy,
  engineerName,
  reportedTime,
}) {
  const transporter = getTransporter();
  const finalRecipients = buildRecipientList(recipients, getAdminEmails());

  if (!transporter || !finalRecipients.length) {
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: finalRecipients.join(", "),
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

export async function sendTaskUpdatedEmail({
  recipients,
  taskId,
  reportId,
  customerName,
  engineerName,
  status,
  workDate,
  observation,
  workDone,
  location,
  photoUrls = [],
}) {
  const transporter = getTransporter();
  const finalRecipients = buildRecipientList(recipients, getAdminEmails());

  if (!transporter || !finalRecipients.length) {
    return;
  }

  const imageLinks = photoUrls.length
    ? photoUrls.map((url, index) => `Image ${index + 1}: ${url}`).join("\n")
    : "Images: -";

  const imagePreviewHtml = photoUrls.length
    ? `
      <p><strong>Images:</strong></p>
      <ul>
        ${photoUrls.map((url, index) => `<li><a href="${url}">Image ${index + 1}</a></li>`).join("")}
      </ul>
      <div>
        ${photoUrls
          .map(
            (url, index) =>
              `<p style="margin:8px 0 4px;"><strong>Image ${index + 1}</strong></p><img src="${url}" alt="Task image ${index + 1}" style="max-width:320px;border:1px solid #ddd;border-radius:6px;" />`
          )
          .join("")}
      </div>
    `
    : `<p><strong>Images:</strong> -</p>`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: finalRecipients.join(", "),
    subject: `Task Report Updated: #${taskId}`,
    text: [
      `Task ID: ${taskId}`,
      `Report ID: ${reportId || "-"}`,
      `Customer Name: ${customerName}`,
      `Engineer Name: ${engineerName}`,
      `Updated Status: ${status}`,
      `Work Date: ${workDate}`,
      `Observation: ${observation || "-"}`,
      `Work Done: ${workDone || "-"}`,
      `Location: ${location || "-"}`,
      imageLinks,
    ].join("\n"),
    html: `
      <p><strong>Task ID:</strong> ${taskId}</p>
      <p><strong>Report ID:</strong> ${reportId || "-"}</p>
      <p><strong>Customer Name:</strong> ${customerName}</p>
      <p><strong>Engineer Name:</strong> ${engineerName}</p>
      <p><strong>Updated Status:</strong> ${status}</p>
      <p><strong>Work Date:</strong> ${workDate}</p>
      <p><strong>Observation:</strong> ${observation || "-"}</p>
      <p><strong>Work Done:</strong> ${workDone || "-"}</p>
      <p><strong>Location:</strong> ${location || "-"}</p>
      ${imagePreviewHtml}
    `,
  });
}
