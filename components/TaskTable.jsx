"use client";

import { Pencil, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/utils/dateFormatter";

function statusVariant(status) {
  if (status === "Completed") return "default";
  if (status === "To Do") return "outline";
  return "secondary";
}

export default function TaskTable({ tasks, onEdit, onPrint }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task ID</TableHead>
          <TableHead>Customer Name</TableHead>
          <TableHead>Reported By</TableHead>
          <TableHead>Engineer Name</TableHead>
          <TableHead>Reported Datetime</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-14 text-center">Edit</TableHead>
          <TableHead className="w-14 text-center">Print</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="py-6 text-center text-muted">
              No tasks found. Create a task to get started.
            </TableCell>
          </TableRow>
        ) : (
          tasks.map((task) => (
            <TableRow key={task.task_id}>
              <TableCell className="font-medium">#{task.task_id}</TableCell>
              <TableCell>{task.cust_name}</TableCell>
              <TableCell>{task.task_reported_by || "-"}</TableCell>
              <TableCell>{task.engg_name || "-"}</TableCell>
              <TableCell>{formatDateTime(task.reported_datetime)}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
              </TableCell>
              <TableCell className="text-center">
                <Button variant="ghost" size="icon" onClick={() => onEdit(task)}>
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit Task</span>
                </Button>
              </TableCell>
              <TableCell className="text-center">
                <Button variant="ghost" size="icon" onClick={() => onPrint(task)}>
                  <Printer className="h-4 w-4" />
                  <span className="sr-only">Print Task</span>
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
