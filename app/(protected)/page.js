"use client";

import { useEffect, useMemo, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import NewTaskModal from "@/components/NewTaskModal";
import EditTaskModal from "@/components/EditTaskModal";
import PreviewTaskModal from "@/components/PreviewTaskModal";
import TaskTable from "@/components/TaskTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/utils/dateFormatter";

export default function HomePage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [previewTaskOpen, setPreviewTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const dashboardSummary = useMemo(() => {
    const completed = tasks.filter((task) => task.status === "Completed").length;
    const pending = tasks.filter((task) => task.status === "Pending").length;
    const todo = tasks.filter((task) => task.status === "To Do").length;

    return { total: tasks.length, completed, pending, todo };
  }, [tasks]);

  async function fetchTasks() {
    try {
      setLoading(true);
      const response = await fetch("/api/get_tasks", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to fetch tasks");
      }

      setTasks(payload.tasks || []);
    } catch (error) {
      toast.error(error.message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  function openEdit(task) {
    setSelectedTask(task);
    setEditTaskOpen(true);
  }

  function openPreview(task) {
    setSelectedTask(task);
    setPreviewTaskOpen(true);
  }

  async function printTask(task) {
    try {
      const response = await fetch(`/api/generate_pdf?task_id=${task.task_id}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to generate report");
      }

      const report = payload.report;

      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "794px";
      container.style.background = "#ffffff";
      container.style.padding = "24px";
      container.style.fontFamily = "Segoe UI, sans-serif";

      container.innerHTML = `
        <h1 style="margin:0 0 8px;font-size:20px;color:#0f3a75;">Intense Technologies - Task Report</h1>
        <p style="margin:0 0 16px;color:#475569;">Generated on ${new Date().toLocaleString()}</p>
        <hr style="border:0;border-top:1px solid #dbe3ef;margin:0 0 16px;" />
        <h2 style="font-size:16px;margin:0 0 8px;">Task Details</h2>
        <p><strong>Task ID:</strong> ${payload.task.task_id}</p>
        <p><strong>Customer:</strong> ${payload.task.cust_name}</p>
        <p><strong>Address:</strong> ${payload.task.address}</p>
        <p><strong>Reported By:</strong> ${payload.task.task_reported_by || "-"}</p>
        <p><strong>Engineer Name:</strong> ${payload.task.engg_name || "-"}</p>
        <p><strong>Reported Datetime:</strong> ${formatDateTime(payload.task.reported_datetime)}</p>
        <p><strong>Status:</strong> ${payload.task.status || "Pending"}</p>
        <hr style="border:0;border-top:1px solid #dbe3ef;margin:16px 0;" />
        <h2 style="font-size:16px;margin:0 0 8px;">Latest Report Entry</h2>
        <p><strong>Observation:</strong> ${report?.observation || "-"}</p>
        <p><strong>Work Done:</strong> ${report?.work_done || "-"}</p>
        <p><strong>Work Date:</strong> ${report?.work_date || "-"}</p>
        <p><strong>Start Time:</strong> ${report?.start_time || "-"}</p>
        <p><strong>End Time:</strong> ${report?.end_time || "-"}</p>
        <p><strong>Location:</strong> ${report?.location || "-"}</p>
        <p><strong>Photo URL:</strong> ${report?.photo || "-"}</p>
      `;

      document.body.appendChild(container);
      const canvas = await html2canvas(container, { scale: 2 });
      document.body.removeChild(container);

      const imageData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = (canvas.height * pageWidth) / canvas.width;

      pdf.addImage(imageData, "PNG", 0, 0, pageWidth, pageHeight);
      pdf.save(`task-${task.task_id}.pdf`);
      toast.success("PDF generated successfully");
    } catch (error) {
      toast.error(error.message || "Failed to create PDF");
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tasks</CardDescription>
            <CardTitle className="text-2xl">{dashboardSummary.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-2xl">{dashboardSummary.completed}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl">{dashboardSummary.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>To Do</CardDescription>
            <CardTitle className="text-2xl">{dashboardSummary.todo}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Service Tasks</CardTitle>
            <CardDescription>Tasks sorted by latest reported datetime first.</CardDescription>
          </div>
          <Button onClick={() => setNewTaskOpen(true)}>
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted">Loading tasks...</p>
          ) : (
            <TaskTable tasks={tasks} onEdit={openEdit} onPrint={printTask} onPreview={openPreview} />
          )}
        </CardContent>
      </Card>

      <NewTaskModal open={newTaskOpen} onOpenChange={setNewTaskOpen} onCreated={fetchTasks} />
      <EditTaskModal
        open={editTaskOpen}
        onOpenChange={setEditTaskOpen}
        task={selectedTask}
        onUpdated={fetchTasks}
      />
      <PreviewTaskModal
        open={previewTaskOpen}
        onOpenChange={setPreviewTaskOpen}
        task={selectedTask}
      />
    </main>
  );
}
