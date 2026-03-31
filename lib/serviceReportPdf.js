function escapeHtml(value) {
  return String(value ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDateOnly(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-GB");
}

function formatTimeOnly(value) {
  if (!value) return "-";

  const asDate = new Date(`1970-01-01T${value}`);
  if (!Number.isNaN(asDate.getTime())) {
    return asDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function buildFormValue(value) {
  return escapeHtml(value || "-");
}

function buildCopyMarkup(data, copyLabel) {
  return `
    <div class="sr-wrap">
      <div class="sr-copy-badge">${copyLabel}</div>

      <div class="sr-head">
        <div>SERVICE REPORT</div>
        <div class="sr-report-no" style="font-weight:500;">No. <strong>${buildFormValue(data.reportId)}</strong></div>
      </div>

      <div class="sr-top">
        <div class="sr-left">
          <div class="sr-line">
            <div class="sr-label">Customer Name &amp; Add :</div>
            <div class="sr-value">${buildFormValue(data.customerName)} - ${buildFormValue(data.address)}</div>
          </div>
          <div class="sr-line">
            <div class="sr-label">Task ID :</div>
            <div class="sr-value">${buildFormValue(data.taskId)}</div>
          </div>
        </div>

        <div class="sr-right">
          <div class="sr-logo">
            <img src="/logo.png" alt="Intense" style="width:30px;height:30px;object-fit:contain;" />
            <div>
              <div style="font-size:22px;letter-spacing:0.8px;line-height:1;color:#ea7b23;font-weight:700;">INTENSE</div>
              <div style="font-size:9px;">Fire Industries | Technologies | Enterprises</div>
            </div>
          </div>
          <div style="font-size:9px;">Cell 8083272272 | email-mail.intensegroup@gmail.com</div>
        </div>
      </div>

      <div class="sr-info-grid" style="grid-template-columns:80px 1fr 60px 110px 70px 110px 62px 1fr;">
        <div>Engineer</div>
        <div>${buildFormValue(data.engineerName)}</div>
        <div>Date</div>
        <div>${buildFormValue(data.reportedDate)}</div>
        <div>Time</div>
        <div>${buildFormValue(data.reportedTime)}</div>
        <div>Status</div>
        <div>${buildFormValue(data.status)}</div>
      </div>

      <div class="sr-info-grid" style="grid-template-columns:82px 1.3fr 66px 1fr;">
        <div>Reported By</div>
        <div>${buildFormValue(data.reportedBy)}</div>
        <div>Location</div>
        <div>${buildFormValue(data.location)}</div>
      </div>

      <div class="sr-section">
        <div class="sr-section-title">Observation</div>
        <div class="sr-section-body sr-observation-text">${buildFormValue(data.problemReported)}</div>
      </div>

      <div class="sr-section">
        <div class="sr-section-title">Work Done</div>
        <div class="sr-section-body sr-workdone-text">${buildFormValue(data.workDone)}</div>
      </div>

      <div class="sr-bottom">
        <div>Work Date</div>
        <div class="fill">${buildFormValue(data.workDate)}</div>
        <div>In Time</div>
        <div class="fill">${buildFormValue(data.inTime)}</div>
        <div>Out Time</div>
        <div class="fill">${buildFormValue(data.outTime)}</div>
        <div></div>
        <div></div>
      </div>

      <div class="sr-sign">
        <div class="sr-sign-block">
          <div class="sr-sign-line"></div>
          <div class="sr-sign-label">Engineer Sign.</div>
        </div>
        <div class="sr-sign-block">
          <div class="sr-sign-line"></div>
          <div class="sr-sign-label">User Sign.</div>
        </div>
        <div class="sr-sign-block">
          <div class="sr-sign-line"></div>
          <div class="sr-sign-label">Office Sign.</div>
        </div>
      </div>
    </div>
  `;
}

export function buildServiceReportPrintHtml(payload) {
  const report = payload?.report || null;

  const data = {
    reportId: report?.report_id || payload?.task?.task_id,
    taskId: payload?.task?.task_id,
    customerName: payload?.task?.cust_name,
    address: payload?.task?.address,
    engineerName: payload?.task?.engg_name,
    reportedBy: payload?.task?.task_reported_by,
    reportedDate: formatDateOnly(payload?.task?.reported_datetime),
    reportedTime: formatTimeOnly(payload?.task?.reported_datetime),
    location: payload?.resolvedLocation || report?.location || "-",
    problemReported: report?.observation || report?.work_done || "-",
    workDone: report?.work_done || "-",
    workDate: formatDateOnly(report?.work_date || payload?.task?.reported_datetime),
    inTime: formatTimeOnly(report?.start_time || payload?.task?.reported_datetime),
    outTime: formatTimeOnly(report?.end_time || "-"),
    status: report?.status || payload?.task?.status || "Pending",
  };

  return `
    <style>
      .sr-page {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        height: 1122px;
        box-sizing: border-box;
        padding: 24px;
        gap: 22px;
        color: #111827;
        font-size: 11px;
        line-height: 1.35;
      }

      .sr-wrap {
        border: 1.4px solid #111827;
        padding: 10px 12px 9px;
        position: relative;
        box-sizing: border-box;
      }

      .sr-copy-badge {
        position: absolute;
        top: 5px;
        right: 10px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.2px;
      }

      .sr-report-no {
        margin-top: 11px;
      }

      .sr-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 7px;
        border-bottom: 1px solid #374151;
        font-weight: 700;
        font-size: 13px;
      }

      .sr-top {
        margin-top: 7px;
        display: grid;
        grid-template-columns: 1.5fr 1fr;
        border-bottom: 1px solid #374151;
        align-items: stretch;
      }

      .sr-left {
        border-right: 1px solid #374151;
        padding-right: 6px;
      }

      .sr-right {
        padding-left: 8px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding-top: 4px;
        padding-bottom: 4px;
        gap: 4px;
      }

      .sr-line {
        display: grid;
        grid-template-columns: 150px 1fr;
        border-bottom: 1px solid #6b7280;
        min-height: 30px;
        align-items: center;
      }

      .sr-line:last-child {
        border-bottom: none;
      }

      .sr-label {
        padding: 4px 5px 4px 0;
      }

      .sr-value {
        word-break: break-word;
        overflow-wrap: anywhere;
        padding: 4px 0;
      }

      .sr-logo {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .sr-info-grid {
        display: grid;
        align-items: start;
        border-bottom: 1px solid #374151;
        min-height: 30px;
        column-gap: 7px;
        padding: 4px 0;
      }

      .sr-info-grid div {
        padding: 2px 0;
        min-width: 0;
        overflow-wrap: anywhere;
      }

      .sr-section {
        border-bottom: 1px solid #374151;
        padding: 8px 0 10px;
      }

      .sr-section-title {
        font-weight: 700;
        margin-bottom: 5px;
      }

      .sr-section-body {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        padding-bottom: 2px;
      }

      .sr-observation-text {
        min-height: 56px;
      }

      .sr-workdone-text {
        min-height: 58px;
      }

      .sr-bottom {
        display: grid;
        grid-template-columns: 68px 140px 56px 90px 64px 90px 1fr;
        margin-top: 12px;
        align-items: center;
        column-gap: 8px;
        row-gap: 2px;
      }

      .sr-bottom .fill {
        border-bottom: 1px solid #6b7280;
        min-height: 20px;
        display: flex;
        align-items: center;
        padding: 0 2px 2px;
        line-height: 1.15;
      }

      .sr-sign {
        margin-top: 14px;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 12px;
      }

      .sr-sign-block {
        min-height: 56px;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
      }

      .sr-sign-line {
        border-top: 1px solid #374151;
      }

      .sr-sign-label {
        padding-top: 4px;
      }
    </style>

    <div class="sr-page">
      ${buildCopyMarkup(data, "MAIN COPY")}
      ${buildCopyMarkup(data, "CUSTOMER COPY")}
    </div>
  `;
}
