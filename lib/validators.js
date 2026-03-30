import { z } from "zod";

export const createTaskSchema = z.object({
  cust_name: z.string().trim().min(2).max(150),
  address: z.string().trim().min(3).max(1000),
  task_reported_by: z.string().trim().min(2).max(150),
  reporter_email: z.email().optional().or(z.literal("")),
  engg_name: z.string().trim().min(2).max(150),
  engg_email: z.email(),
});

export const updateTaskSchema = z.object({
  task_id: z.number().int().positive(),
  observation: z.string().trim().max(5000).optional().default(""),
  work_done: z.string().trim().max(5000).optional().default(""),
  work_date: z.string().min(1),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
  location: z.string().trim().min(1).max(255),
  reporter_email: z.email(),
  photos: z.array(z.string().url()).optional().default([]),
  status: z.enum(["Completed", "Pending", "To Do"]),
});
