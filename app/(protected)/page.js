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
import { buildServiceReportPrintHtml } from "@/lib/serviceReportPdf";

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

      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "794px";
      container.style.background = "#ffffff";
      container.style.padding = "0";
      container.style.fontFamily = "Times New Roman, serif";
      container.innerHTML = buildServiceReportPrintHtml(payload);

      document.body.appendChild(container);

      // Ensure logo image is loaded before canvas capture.
      const images = Array.from(container.querySelectorAll("img"));
      await Promise.all(
        images.map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) {
                resolve();
                return;
              }

              img.onload = () => resolve();
              img.onerror = () => resolve();
            })
        )
      );

      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
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
      {/* <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      </section> */}

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
          <TaskTable
            tasks={tasks}
            loading={loading}
            onEdit={openEdit}
            onPrint={printTask}
            onPreview={openPreview}
          />
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
