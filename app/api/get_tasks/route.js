import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const rows = await query(
      `SELECT task_id, cust_name, address, task_reported_by, reported_datetime, engg_name, status
       FROM tasks
       ORDER BY reported_datetime DESC`
    );

    return NextResponse.json({ tasks: rows });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch tasks", details: error.message },
      { status: 500 }
    );
  }
}
