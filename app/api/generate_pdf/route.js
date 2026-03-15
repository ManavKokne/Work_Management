import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = Number(searchParams.get("task_id"));

    if (!taskId) {
      return NextResponse.json({ error: "task_id is required" }, { status: 400 });
    }

    const taskRows = await query(
      `SELECT task_id, cust_name, address, task_reported_by, reported_datetime, engg_name, status
       FROM tasks
       WHERE task_id = ?`,
      [taskId]
    );

    if (!taskRows.length) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const reportRows = await query(
      `SELECT report_id, task_id, observation, work_done, work_date, start_time, end_time, location, photo, status
       FROM reports
       WHERE task_id = ?
       ORDER BY report_id DESC`,
      [taskId]
    );

    return NextResponse.json({
      task: taskRows[0],
      report: reportRows[0] || null,
      reports: reportRows,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to collect report data", details: error.message },
      { status: 500 }
    );
  }
}
