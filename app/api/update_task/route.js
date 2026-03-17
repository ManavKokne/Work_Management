import { NextResponse } from "next/server";
import { updateTaskSchema } from "@/lib/validators";
import { query, withTransaction } from "@/lib/db";
import { sendTaskUpdatedEmail } from "@/lib/email";
import { ensureCoreTables, ensureTaskEmailColumn } from "@/lib/taskSchema";
import { serializePhotoUrls } from "@/lib/reportPhotos";

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = updateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const payload = parsed.data;
    const serializedPhotos = serializePhotoUrls(payload.photos);

    await ensureCoreTables();
    await ensureTaskEmailColumn();

    await withTransaction(async (connection) => {
      await connection.execute(
        `INSERT INTO reports
           (task_id, observation, work_done, work_date, start_time, end_time, location, photo, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          payload.task_id,
          payload.observation,
          payload.work_done,
          payload.work_date,
          payload.start_time,
          payload.end_time,
          payload.location,
          serializedPhotos,
          payload.status,
        ]
      );

      await connection.execute(`UPDATE tasks SET status = ? WHERE task_id = ?`, [
        payload.status,
        payload.task_id,
      ]);
    });

    const tasks = await query(
      `SELECT task_id, cust_name, engg_name, engg_email
       FROM tasks
       WHERE task_id = ?`,
      [payload.task_id]
    );

    const task = tasks[0];

    if (task?.engg_email) {
      await sendTaskUpdatedEmail({
        recipient: task.engg_email,
        taskId: task.task_id,
        customerName: task.cust_name,
        engineerName: task.engg_name,
        status: payload.status,
        workDate: payload.work_date,
        observation: payload.observation,
        workDone: payload.work_done,
        location: payload.location,
        photoUrls: payload.photos,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update task", details: error.message },
      { status: 500 }
    );
  }
}
