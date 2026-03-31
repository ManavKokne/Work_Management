import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { sendTaskCreatedEmail } from "@/lib/email";
import {
  ensureCoreTables,
  ensureTaskEmailColumn,
  ensureTaskReporterEmailColumn,
} from "@/lib/taskSchema";
import { createTaskSchema } from "@/lib/validators";

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { cust_name, address, task_reported_by, reporter_email, engg_name, engg_email } = parsed.data;

    await ensureCoreTables();
    await ensureTaskEmailColumn();
    await ensureTaskReporterEmailColumn();

    const insertedRows = await query(
      `INSERT INTO tasks (cust_name, address, task_reported_by, reporter_email, engg_name, engg_email, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING task_id`,
      [cust_name, address, task_reported_by, reporter_email || null, engg_name, engg_email, "Pending"]
    );

    const taskId = insertedRows[0]?.task_id;

    const rows = await query(
      `SELECT task_id, cust_name, address, task_reported_by, reporter_email, engg_name, engg_email, reported_datetime
       FROM tasks
       WHERE task_id = $1`,
      [taskId]
    );

    const task = rows[0];

    await sendTaskCreatedEmail({
      recipients: [task.engg_email || engg_email, task.reporter_email || reporter_email],
      taskId: task.task_id,
      customerName: task.cust_name,
      address: task.address,
      reportedBy: task.task_reported_by,
      engineerName: task.engg_name,
      reportedTime: new Date(task.reported_datetime).toLocaleString(),
    });

    return NextResponse.json({ success: true, task_id: taskId });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create task", details: error.message },
      { status: 500 }
    );
  }
}
