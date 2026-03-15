import { NextResponse } from "next/server";
import { updateTaskSchema } from "@/lib/validators";
import { withTransaction } from "@/lib/db";

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
          payload.photo || null,
          payload.status,
        ]
      );

      await connection.execute(`UPDATE tasks SET status = ? WHERE task_id = ?`, [
        payload.status,
        payload.task_id,
      ]);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update task", details: error.message },
      { status: 500 }
    );
  }
}
