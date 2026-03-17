"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Printer } from "lucide-react";
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

function getPageSize() {
  if (typeof window === "undefined") return 6;

  const width = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const tableHeight = width < 640
    ? Math.min(viewportHeight * 0.46, 430)
    : width < 1024
      ? Math.min(viewportHeight * 0.54, 520)
      : Math.min(viewportHeight * 0.6, 560);

  const estimatedHeaderHeight = 48;
  const estimatedRowHeight = 82;
  const rowsFromHeight = Math.floor((tableHeight - estimatedHeaderHeight) / estimatedRowHeight);

  if (width < 640) return Math.max(3, Math.min(5, rowsFromHeight));
  if (width < 1024) return Math.max(4, Math.min(6, rowsFromHeight));
  return Math.max(5, Math.min(8, rowsFromHeight));
}

function statusVariant(status) {
  if (status === "Completed") return "default";
  if (status === "To Do") return "outline";
  return "secondary";
}

export default function TaskTable({ tasks, onEdit, onPrint, onPreview, loading = false }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(getPageSize);

  useEffect(() => {
    function handleResize() {
      setPageSize(getPageSize());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalPages = useMemo(() => {
    const total = Math.ceil(tasks.length / pageSize);
    return Math.max(1, total);
  }, [tasks.length, pageSize]);

  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageItems = tasks.slice(startIndex, startIndex + pageSize);

  function goPrevious() {
    setPage((prev) => Math.max(1, prev - 1));
  }

  function goNext() {
    setPage((prev) => Math.min(totalPages, prev + 1));
  }

  return (
    <div className="rounded-md border">
      <div className="max-h-[min(46dvh,430px)] overflow-auto sm:max-h-[min(54dvh,520px)] lg:max-h-[min(60dvh,560px)]">
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
              <TableHead className="w-14 text-center">Preview</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  <TableCell className="h-12">Loading...</TableCell>
                  <TableCell>Loading...</TableCell>
                  <TableCell>Loading...</TableCell>
                  <TableCell>Loading...</TableCell>
                  <TableCell>Loading...</TableCell>
                  <TableCell>Loading...</TableCell>
                  <TableCell className="text-center">...</TableCell>
                  <TableCell className="text-center">...</TableCell>
                  <TableCell className="text-center">...</TableCell>
                </TableRow>
              ))
            ) : (
              <>
                {pageItems.map((task) => (
                  <TableRow key={task.task_id}>
                    <TableCell className="h-12 font-medium">#{task.task_id}</TableCell>
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
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" onClick={() => onPreview(task)}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Preview Task</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {tasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="h-12 text-center text-muted">
                      No tasks available yet. Create a new task to get started.
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2 border-t px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted sm:text-sm">
          {loading
            ? "Loading tasks..."
            : tasks.length === 0
              ? "No tasks to display"
              : `Showing ${startIndex + 1}-${Math.min(startIndex + pageSize, tasks.length)} of ${tasks.length}`}
        </p>
        <div className="flex items-center justify-center gap-1.5 sm:justify-end sm:gap-2">
          <Button
            variant="outline"
            className="h-8 min-w-14 px-2 text-xs sm:h-9 sm:min-w-18 sm:px-3 sm:text-sm"
            onClick={goPrevious}
            disabled={loading || safePage === 1}
          >
            <span className="sm:hidden">Prev</span>
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <span className="min-w-16 text-center text-xs text-muted sm:min-w-20">Page {safePage}/{totalPages}</span>
          <Button
            variant="outline"
            className="h-8 min-w-14 px-2 text-xs sm:h-9 sm:min-w-18 sm:px-3 sm:text-sm"
            onClick={goNext}
            disabled={loading || safePage === totalPages}
          >
            <span className="sm:hidden">Next</span>
            <span className="hidden sm:inline">Next</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
