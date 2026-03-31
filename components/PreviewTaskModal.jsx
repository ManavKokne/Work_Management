"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parsePhotoUrls } from "@/lib/reportPhotos";
import { formatDateTime } from "@/utils/dateFormatter";

function fieldValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  return value;
}

export default function PreviewTaskModal({ open, onOpenChange, task }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ task: null, report: null });

  useEffect(() => {
    if (!open || !task?.task_id) return;

    let ignore = false;

    async function fetchPreviewData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/generate_pdf?task_id=${task.task_id}`, {
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Failed to load preview");
        }

        if (!ignore) {
          setData({ task: payload.task || null, report: payload.report || null });
        }
      } catch (error) {
        if (!ignore) {
          setData({ task: null, report: null });
        }
        toast.error(error.message || "Failed to load preview");
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchPreviewData();

    return () => {
      ignore = true;
    };
  }, [open, task?.task_id]);

  const previewTask = data.task || task;
  const previewReport = data.report;
  const previewPhotos = parsePhotoUrls(previewReport?.photo);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-4xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Task Preview #{task?.task_id}</DialogTitle>
          <DialogDescription>
            Review customer details, latest report, and uploaded photo.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
          {loading ? (
            <p className="text-sm text-muted">Loading preview...</p>
          ) : (
            <>
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Task Details</h3>
                <div className="grid gap-2 text-sm sm:grid-cols-2 sm:gap-4">
                  <p>
                    <span className="font-medium">Customer:</span> {fieldValue(previewTask?.cust_name)}
                  </p>
                  <p>
                    <span className="font-medium">Reported By:</span>{" "}
                    {fieldValue(previewTask?.task_reported_by)}
                  </p>
                  <p className="sm:col-span-2">
                    <span className="font-medium">Address:</span> {fieldValue(previewTask?.address)}
                  </p>
                  <p>
                    <span className="font-medium">Engineer:</span> {fieldValue(previewTask?.engg_name)}
                  </p>
                  <p>
                    <span className="font-medium">Reported Datetime:</span>{" "}
                    {formatDateTime(previewTask?.reported_datetime)}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span> {fieldValue(previewTask?.status)}
                  </p>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Latest Report Entry</h3>
                {previewReport ? (
                  <div className="grid gap-2 text-sm sm:grid-cols-2 sm:gap-4">
                    <p className="sm:col-span-2">
                      <span className="font-medium">Observation:</span>{" "}
                      {fieldValue(previewReport.observation)}
                    </p>
                    <p className="sm:col-span-2">
                      <span className="font-medium">Work Done:</span> {fieldValue(previewReport.work_done)}
                    </p>
                    <p>
                      <span className="font-medium">Work Date:</span> {fieldValue(previewReport.work_date)}
                    </p>
                    <p>
                      <span className="font-medium">Start Time:</span> {fieldValue(previewReport.start_time)}
                    </p>
                    <p>
                      <span className="font-medium">End Time:</span> {fieldValue(previewReport.end_time)}
                    </p>
                    <p>
                      <span className="font-medium">Location:</span> {fieldValue(previewReport.location)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted">No report entry available yet for this task.</p>
                )}
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Photos</h3>
                {previewPhotos.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {previewPhotos.map((photoUrl, index) => (
                      <img
                        key={`${photoUrl}-${index}`}
                        src={photoUrl}
                        alt={`Task ${task?.task_id} report ${index + 1}`}
                        className="max-h-72 w-full rounded-md border border-border object-contain"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted">No photos uploaded.</p>
                )}
              </section>
            </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
