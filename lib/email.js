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

export async function sendTaskUpdatedEmail({
  recipient,
  taskId,
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

  if (!transporter || !recipient) {
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
    to: recipient,
    subject: `Task Report Updated: #${taskId}`,
    text: [
      `Task ID: ${taskId}`,
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
