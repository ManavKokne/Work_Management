import "server-only";
import { query } from "@/lib/db";

let hasEnsuredCoreTables = false;
let hasEnsuredTaskEmailColumn = false;
let hasEnsuredReportPhotoColumn = false;

export async function ensureCoreTables() {
  if (hasEnsuredCoreTables) {
    return;
  }

  // Uses the database selected by DB_NAME in env via mysql2 connection config.
  // Intentionally does not create databases; it only ensures required tables exist.
  await query(`
    CREATE TABLE IF NOT EXISTS tasks (
      task_id INT NOT NULL AUTO_INCREMENT,
      cust_name VARCHAR(150) NOT NULL,
      address TEXT NOT NULL,
      task_reported_by VARCHAR(150) DEFAULT NULL,
      reported_datetime DATETIME DEFAULT CURRENT_TIMESTAMP,
      engg_name VARCHAR(150) DEFAULT NULL,
      engg_email VARCHAR(255) DEFAULT NULL,
      status VARCHAR(50) DEFAULT 'Pending',
      PRIMARY KEY (task_id)
    ) ENGINE=InnoDB
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS reports (
      report_id INT NOT NULL AUTO_INCREMENT,
      task_id INT NOT NULL,
      observation TEXT,
      work_done TEXT,
      work_date DATE,
      start_time TIME,
      end_time TIME,
      location VARCHAR(255),
      photo VARCHAR(255),
      status VARCHAR(50),
      PRIMARY KEY (report_id),
      KEY idx_reports_task_id (task_id),
      CONSTRAINT fk_reports_task FOREIGN KEY (task_id) REFERENCES tasks(task_id)
    ) ENGINE=InnoDB
  `);

  await ensureReportPhotoColumn();

  hasEnsuredCoreTables = true;
}

async function ensureReportPhotoColumn() {
  if (hasEnsuredReportPhotoColumn) {
    return;
  }

  const rows = await query(
    `SELECT DATA_TYPE AS dataType
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'reports'
       AND COLUMN_NAME = 'photo'`
  );

  const dataType = String(rows?.[0]?.dataType || "").toLowerCase();
  const isTextCompatible = ["text", "mediumtext", "longtext"].includes(dataType);

  if (!isTextCompatible) {
    await query(`ALTER TABLE reports MODIFY COLUMN photo TEXT NULL`);
  }

  hasEnsuredReportPhotoColumn = true;
}

export async function ensureTaskEmailColumn() {
  await ensureCoreTables();

  if (hasEnsuredTaskEmailColumn) {
    return;
  }

  const rows = await query(
    `SELECT COUNT(*) AS columnCount
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'tasks'
       AND COLUMN_NAME = 'engg_email'`
  );

  const count = Number(rows?.[0]?.columnCount || 0);

  if (count === 0) {
    await query(`ALTER TABLE tasks ADD COLUMN engg_email VARCHAR(255) NULL AFTER engg_name`);
  }

  hasEnsuredTaskEmailColumn = true;
}
