import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  ensureCoreTables,
  ensureTaskEmailColumn,
  ensureTaskReporterEmailColumn,
  ensureReportReporterEmailColumn,
} from "@/lib/taskSchema";

export async function GET() {
  try {
    await ensureCoreTables();
    await ensureTaskEmailColumn();
    await ensureTaskReporterEmailColumn();
    await ensureReportReporterEmailColumn();

    const rows = await query(
      `SELECT task_id, cust_name, address, task_reported_by, reporter_email, reported_datetime, engg_name, engg_email, status
       FROM tasks
       ORDER BY reported_datetime DESC`
    );

    const enggEmailRows = await query(
      `SELECT DISTINCT engg_email
       FROM tasks
       WHERE engg_email IS NOT NULL AND TRIM(engg_email) <> ''
       ORDER BY engg_email ASC`
    );

    const reporterEmailRows = await query(
      `SELECT DISTINCT reporter_email
       FROM reports
       WHERE reporter_email IS NOT NULL AND TRIM(reporter_email) <> ''
       ORDER BY reporter_email ASC`
    );

    const taskReporterRows = await query(
      `SELECT DISTINCT reporter_email
       FROM tasks
       WHERE reporter_email IS NOT NULL AND TRIM(reporter_email) <> ''
       ORDER BY reporter_email ASC`
    );

    const enggEmailOptions = enggEmailRows.map((row) => row.engg_email);
    const reporterEmailOptions = [
      ...new Set([
        ...reporterEmailRows.map((row) => row.reporter_email),
        ...taskReporterRows.map((row) => row.reporter_email),
      ]),
    ];

    return NextResponse.json({
      tasks: rows,
      enggEmailOptions,
      reporterEmailOptions,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch tasks", details: error.message },
      { status: 500 }
    );
  }
}
