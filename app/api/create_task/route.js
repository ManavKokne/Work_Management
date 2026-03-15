import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { sendTaskCreatedEmail } from "@/lib/email";
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

    const { cust_name, address, task_reported_by, engg_name, engg_email } = parsed.data;

    const result = await query(
      `INSERT INTO tasks (cust_name, address, task_reported_by, engg_name, status)
       VALUES (?, ?, ?, ?, ?)`,
      [cust_name, address, task_reported_by, engg_name, "Pending"]
    );

    const taskId = result.insertId;

    const rows = await query(
      `SELECT task_id, cust_name, address, task_reported_by, engg_name, reported_datetime
       FROM tasks
       WHERE task_id = ?`,
      [taskId]
    );

    const task = rows[0];

    await sendTaskCreatedEmail({
      recipient: engg_email,
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
