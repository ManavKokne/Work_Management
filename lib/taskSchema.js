import "server-only";
import { query } from "@/lib/db";

let hasEnsuredCoreTables = false;

export async function ensureCoreTables() {
  if (hasEnsuredCoreTables) {
    return;
  }

  await query(`
    CREATE TABLE IF NOT EXISTS tasks (
      task_id SERIAL PRIMARY KEY,
      cust_name VARCHAR(150) NOT NULL,
      address TEXT NOT NULL,
      task_reported_by VARCHAR(150) DEFAULT NULL,
      reporter_email VARCHAR(255) DEFAULT NULL,
      reported_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      engg_name VARCHAR(150) DEFAULT NULL,
      engg_email VARCHAR(255) DEFAULT NULL,
      status VARCHAR(50) DEFAULT 'Pending'
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS reports (
      report_id SERIAL PRIMARY KEY,
      task_id INT NOT NULL,
      observation TEXT,
      work_done TEXT,
      work_date DATE,
      start_time TIME,
      end_time TIME,
      location VARCHAR(255),
      reporter_email VARCHAR(255),
      photo TEXT,
      status VARCHAR(50),
      CONSTRAINT fk_reports_task FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE
    )
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_reports_task_id ON reports(task_id)`);

  hasEnsuredCoreTables = true;
}

export async function ensureTaskEmailColumn() {
  await ensureCoreTables();
}

export async function ensureTaskReporterEmailColumn() {
  await ensureCoreTables();
}

export async function ensureReportReporterEmailColumn() {
  await ensureCoreTables();
}
