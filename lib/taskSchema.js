import "server-only";
import { query } from "@/lib/db";

let hasEnsuredTaskEmailColumn = false;

export async function ensureTaskEmailColumn() {
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
