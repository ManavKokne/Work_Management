"use client";

import { useEffect, useMemo, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { Plus, SlidersHorizontal, X } from "lucide-react";
import NewTaskModal from "@/components/NewTaskModal";
import EditTaskModal from "@/components/EditTaskModal";
import PreviewTaskModal from "@/components/PreviewTaskModal";
import TaskTable from "@/components/TaskTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildServiceReportPrintHtml } from "@/lib/serviceReportPdf";

export default function HomePage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [previewTaskOpen, setPreviewTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  const [enggEmailOptions, setEnggEmailOptions] = useState([]);
  const [reporterEmailOptions, setReporterEmailOptions] = useState([]);
  const [filters, setFilters] = useState({
    task_id: "",
    cust_name: "",
    task_reported_by: "",
    engg_name: "",
    status: "all",
    reported_date: "",
  });

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
      setEnggEmailOptions(payload.enggEmailOptions || []);
      setReporterEmailOptions(payload.reporterEmailOptions || []);
    } catch (error) {
      toast.error(error.message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const taskIdMatch = !filters.task_id
        || String(task.task_id).includes(filters.task_id.trim());
      const customerMatch = !filters.cust_name
        || String(task.cust_name || "").toLowerCase().includes(filters.cust_name.trim().toLowerCase());
      const reportedByMatch = !filters.task_reported_by
        || String(task.task_reported_by || "").toLowerCase().includes(filters.task_reported_by.trim().toLowerCase());
      const engineerMatch = !filters.engg_name
        || String(task.engg_name || "").toLowerCase().includes(filters.engg_name.trim().toLowerCase());
      const statusMatch = filters.status === "all" || task.status === filters.status;

      const reportedDateMatch = !filters.reported_date || (() => {
        const date = new Date(task.reported_datetime);
        if (Number.isNaN(date.getTime())) return false;
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}` === filters.reported_date;
      })();

      return taskIdMatch
        && customerMatch
        && reportedByMatch
        && engineerMatch
        && statusMatch
        && reportedDateMatch;
    });
  }, [tasks, filters]);

  function onFilterChange(event) {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }

  function onStatusFilterChange(value) {
    setFilters((prev) => ({ ...prev, status: value }));
  }

  function clearFilters() {
    setFilters({
      task_id: "",
      cust_name: "",
      task_reported_by: "",
      engg_name: "",
      status: "all",
      reported_date: "",
    });
  }

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
          <div className="flex flex-row items-center gap-2 self-start sm:self-auto">
            <Button variant="outline" onClick={() => setFiltersDrawerOpen(true)}>
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
            <Button onClick={() => setNewTaskOpen(true)}>
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <TaskTable
            tasks={filteredTasks}
            loading={loading}
            onEdit={openEdit}
            onPrint={printTask}
            onPreview={openPreview}
          />
        </CardContent>
      </Card>

      <NewTaskModal
        open={newTaskOpen}
        onOpenChange={setNewTaskOpen}
        onCreated={fetchTasks}
        enggEmailOptions={enggEmailOptions}
      />
      <EditTaskModal
        open={editTaskOpen}
        onOpenChange={setEditTaskOpen}
        task={selectedTask}
        onUpdated={fetchTasks}
        reporterEmailOptions={reporterEmailOptions}
      />
      <PreviewTaskModal
        open={previewTaskOpen}
        onOpenChange={setPreviewTaskOpen}
        task={selectedTask}
      />

      {filtersDrawerOpen && (
        <button
          type="button"
          aria-label="Close filters"
          className="fixed inset-0 z-40 bg-black/35"
          onClick={() => setFiltersDrawerOpen(false)}
        />
      )}

      <aside
        className={`fixed right-0 top-0 z-50 h-dvh w-[92vw] max-w-sm transform border-l border-border bg-background p-4 shadow-2xl transition-transform duration-300 sm:w-105 ${filtersDrawerOpen ? "translate-x-0" : "translate-x-full"}`}
        aria-hidden={!filtersDrawerOpen}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Filters</h2>
          <Button variant="ghost" size="icon" onClick={() => setFiltersDrawerOpen(false)}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close filters</span>
          </Button>
        </div>

        <div className="grid gap-3">
          <Input
            name="task_id"
            placeholder="Filter Task ID"
            className="bg-white"
            value={filters.task_id}
            onChange={onFilterChange}
          />
          <Input
            name="cust_name"
            placeholder="Filter Customer Name"
            className="bg-white"
            value={filters.cust_name}
            onChange={onFilterChange}
          />
          <Input
            name="task_reported_by"
            placeholder="Filter Reported By"
            className="bg-white"
            value={filters.task_reported_by}
            onChange={onFilterChange}
          />
          <Input
            name="engg_name"
            placeholder="Filter Engineer Name"
            className="bg-white"
            value={filters.engg_name}
            onChange={onFilterChange}
          />
          <Input
            name="reported_date"
            type="date"
            className="bg-white"
            value={filters.reported_date}
            onChange={onFilterChange}
          />
          <Select value={filters.status} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="To Do">To Do</SelectItem>
            </SelectContent>
          </Select>

          <div className="mt-2 flex gap-2">
            <Button className="flex-1" variant="outline" onClick={clearFilters}>Clear Filters</Button>
            <Button className="flex-1" onClick={() => setFiltersDrawerOpen(false)}>Apply</Button>
          </div>
        </div>
      </aside>
    </main>
  );
}
