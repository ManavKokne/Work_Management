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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { parsePhotoUrls } from "@/lib/reportPhotos";
import { formatDateForInput, formatTimeForInput } from "@/utils/dateFormatter";

function getCurrentTime() {
  return new Date().toTimeString().slice(0, 8);
}

const defaultState = {
  observation: "",
  work_done: "",
  work_date: "",
  start_time: "",
  end_time: "",
  location: "Fetching...",
  reporter_email: "",
  status: "Pending",
  photoFiles: [],
  existingPhotos: [],
};

export default function EditTaskModal({
  open,
  onOpenChange,
  task,
  onUpdated,
  reporterEmailOptions = [],
}) {
  const [form, setForm] = useState(defaultState);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !task) return;

    let ignore = false;

    async function prefill() {
      const nowEndTime = getCurrentTime();

      setForm({
        observation: "",
        work_done: "",
        work_date: formatDateForInput(new Date()),
        start_time: formatTimeForInput(task.reported_datetime),
        end_time: nowEndTime,
        location: "Fetching...",
        reporter_email: task.reporter_email || "",
        status: task.status || "Pending",
        photoFiles: [],
        existingPhotos: [],
      });

      try {
        const response = await fetch(`/api/generate_pdf?task_id=${task.task_id}`, {
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Failed to fetch latest report");
        }

        const latestReport = payload.report;
        if (ignore) return;

        if (latestReport) {
          setForm({
            observation: latestReport.observation || "",
            work_done: latestReport.work_done || "",
            work_date: formatDateForInput(latestReport.work_date || new Date()),
            start_time: latestReport.start_time || formatTimeForInput(task.reported_datetime),
            end_time: nowEndTime,
            location: latestReport.location || "Location unavailable",
            reporter_email: latestReport.reporter_email || task.reporter_email || "",
            status: latestReport.status || task.status || "Pending",
            photoFiles: [],
            existingPhotos: parsePhotoUrls(latestReport.photo),
          });
          return;
        }
      } catch {
        // Fall back to a fresh entry with current location.
      }

      if (!navigator.geolocation) {
        setForm((prev) => ({ ...prev, location: "Geolocation unavailable" }));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          const coordinatePair = `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;

          if (ignore) return;

          setForm((prev) => ({
            ...prev,
            location: coordinatePair,
          }));

          try {
            const response = await fetch(
              `/api/reverse_geocode?lat=${coords.latitude}&long=${coords.longitude}`
            );
            const payload = await response.json();

            if (response.ok && payload.locationText && !ignore) {
              setForm((prev) => ({ ...prev, location: payload.locationText }));
            }
          } catch {
            // Keep coordinate pair when reverse geocoding is unavailable.
          }
        },
        () => {
          if (ignore) return;
          setForm((prev) => ({ ...prev, location: "Location unavailable" }));
        }
      );
    }

    prefill();

    return () => {
      ignore = true;
    };
  }, [open, task]);

  function onFieldChange(event) {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  }

  function onStatusChange(value) {
    setForm((prev) => ({ ...prev, status: value }));
  }

  function onPhotoChange(event) {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      setForm((prev) => ({ ...prev, photoFiles: [] }));
      return;
    }

    const hasInvalidFile = files.some((file) => !["image/jpeg", "image/png"].includes(file.type));
    if (hasInvalidFile) {
      toast.error("Only JPG and PNG files are allowed");
      return;
    }

    setForm((prev) => ({ ...prev, photoFiles: files }));
  }

  async function uploadSinglePhoto(file) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary is not configured. Set cloud name and upload preset.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", `reports/${task.task_id}`);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error?.message || "Cloudinary upload failed");
    }

    return payload.secure_url || payload.url || "";
  }

  async function uploadPhotosIfNeeded() {
    if (!form.photoFiles.length) {
      return [];
    }

    const uploaded = await Promise.all(form.photoFiles.map((file) => uploadSinglePhoto(file)));
    return uploaded.filter(Boolean);
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (!task) return;

    setSaving(true);
    try {
      let newPhotoUrls = [];

      if (form.photoFiles.length) {
        try {
          newPhotoUrls = await uploadPhotosIfNeeded();
        } catch {
          toast.warning("Image upload failed. Report details will be saved with existing photos only.");
        }
      }

      const photos = form.photoFiles.length
        ? [...form.existingPhotos, ...newPhotoUrls]
        : form.existingPhotos;

      const payload = {
        task_id: task.task_id,
        observation: form.observation,
        work_done: form.work_done,
        work_date: form.work_date,
        start_time: form.start_time,
        end_time: form.end_time,
        location: form.location,
        reporter_email: form.reporter_email,
        photos,
        status: form.status,
      };

      const response = await fetch("/api/update_task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update task");
      }

      toast.success("Task updated successfully");
      onOpenChange(false);
      onUpdated();
    } catch (error) {
      toast.error(error.message || "Failed to update task");
    } finally {
      setSaving(false);
    }
  }

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[96vw] max-w-5xl overflow-hidden p-4 sm:p-6">
        <DialogHeader className="pr-6">
          <DialogTitle>Update Task #{task.task_id}</DialogTitle>
          <DialogDescription>
            Submit engineer report and update task status.
          </DialogDescription>
        </DialogHeader>

        <form className="grid max-h-[calc(90vh-7.5rem)] gap-4 overflow-y-auto pr-2" onSubmit={onSubmit}>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div className="grid gap-2">
              <Label>Customer Name</Label>
              <Input value={task.cust_name} disabled />
            </div>
            <div className="grid gap-2">
              <Label>Reported By</Label>
              <Input value={task.task_reported_by || ""} disabled />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Address</Label>
            <Textarea value={task.address} disabled />
          </div>

          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div className="grid gap-2">
              <Label>Engineer Name</Label>
              <Input value={task.engg_name || ""} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reporter_email">Reporter Email</Label>
              <Input
                id="reporter_email"
                name="reporter_email"
                type="email"
                list="reporter-email-options"
                value={form.reporter_email}
                onChange={onFieldChange}
                required
              />
              <datalist id="reporter-email-options">
                {reporterEmailOptions.map((email) => (
                  <option key={email} value={email} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div className="grid gap-2">
              <Label>Engineer Email</Label>
              <Input value={task.engg_email || "-"} disabled />
            </div>
            <div className="grid gap-2">
              <Label>Reported Datetime</Label>
              <Input value={new Date(task.reported_datetime).toLocaleString()} disabled />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="observation">Observation</Label>
            <Textarea
              id="observation"
              name="observation"
              value={form.observation}
              onChange={onFieldChange}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="work_done">Work Done</Label>
            <Textarea id="work_done" name="work_done" value={form.work_done} onChange={onFieldChange} />
          </div>

          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="work_date">Work Date</Label>
              <Input id="work_date" name="work_date" type="date" value={form.work_date} onChange={onFieldChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={form.status} onValueChange={onStatusChange}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="To Do">To Do</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 sm:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input id="start_time" name="start_time" type="time" value={form.start_time} onChange={onFieldChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input id="end_time" name="end_time" value={form.end_time} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" value={form.location} disabled />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="photo">Photos (.jpg, .png)</Label>
            <Input id="photo" name="photo" type="file" accept="image/jpeg,image/png" multiple onChange={onPhotoChange} />
            {form.existingPhotos.length > 0 && (
              <p className="text-xs text-muted">Existing photos: {form.existingPhotos.length}</p>
            )}
            {form.photoFiles.length > 0 && (
              <p className="text-xs text-muted">Selected new photos: {form.photoFiles.length}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
