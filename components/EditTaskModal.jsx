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
import { storage } from "@/lib/firebase";
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
  photo: "",
  status: "Pending",
  photoFile: null,
};

export default function EditTaskModal({ open, onOpenChange, task, onUpdated }) {
  const [form, setForm] = useState(defaultState);
  const [saving, setSaving] = useState(false);

  function shouldSkipDirectUploadInDev() {
    const directUploadEnabled =
      process.env.NEXT_PUBLIC_ENABLE_DIRECT_STORAGE_UPLOAD === "true";
    const host = window.location.hostname;
    const isLocalHost = host === "localhost" || host === "127.0.0.1";

    return isLocalHost && !directUploadEnabled;
  }

  useEffect(() => {
    if (!open || !task) return;

    setForm({
      observation: "",
      work_done: "",
      work_date: formatDateForInput(new Date()),
      start_time: formatTimeForInput(task.reported_datetime),
      end_time: getCurrentTime(),
      location: "Fetching...",
      photo: "",
      status: task.status || "Pending",
      photoFile: null,
    });

    if (!navigator.geolocation) {
      setForm((prev) => ({ ...prev, location: "Geolocation unavailable" }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm((prev) => ({
          ...prev,
          location: `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
        }));
      },
      () => {
        setForm((prev) => ({ ...prev, location: "Location unavailable" }));
      }
    );
  }, [open, task]);

  function onFieldChange(event) {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  }

  function onStatusChange(value) {
    setForm((prev) => ({ ...prev, status: value }));
  }

  function onPhotoChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setForm((prev) => ({ ...prev, photoFile: null }));
      return;
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Only JPG and PNG files are allowed");
      return;
    }

    setForm((prev) => ({ ...prev, photoFile: file }));
  }

  async function uploadPhotoIfNeeded() {
    if (!form.photoFile) {
      return "";
    }

    const safeName = form.photoFile.name.replace(/\s+/g, "-").toLowerCase();
    const path = `reports/${task.task_id}/${Date.now()}-${safeName}`;
    const uploadRef = storage.ref(path);

    await uploadRef.put(form.photoFile);
    return uploadRef.getDownloadURL();
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (!task) return;

    setSaving(true);
    try {
      let photoUrl = "";

      if (form.photoFile) {
        if (shouldSkipDirectUploadInDev()) {
          toast.info(
            "Photo upload is disabled on localhost to avoid Firebase CORS errors. Enable NEXT_PUBLIC_ENABLE_DIRECT_STORAGE_UPLOAD=true after configuring bucket CORS."
          );
        } else {
          try {
            photoUrl = await uploadPhotoIfNeeded();
          } catch {
            toast.warning(
              "Photo upload was blocked (CORS). Task details will be saved without the photo."
            );
          }
        }
      }

      const payload = {
        task_id: task.task_id,
        observation: form.observation,
        work_done: form.work_done,
        work_date: form.work_date,
        start_time: form.start_time,
        end_time: form.end_time,
        location: form.location,
        photo: photoUrl,
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
      <DialogContent className="max-h-[90vh] overflow-hidden p-4 sm:p-6">
        <DialogHeader className="pr-6">
          <DialogTitle>Edit Task #{task.task_id}</DialogTitle>
          <DialogDescription>
            Submit engineer report and update task status.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid max-h-[calc(90vh-7.5rem)] gap-4 overflow-y-auto pr-1"
          onSubmit={onSubmit}
        >
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
              <Input id="start_time" name="start_time" value={form.start_time} disabled />
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
            <Label htmlFor="photo">Photo (.jpg, .png)</Label>
            <Input id="photo" name="photo" type="file" accept="image/jpeg,image/png" onChange={onPhotoChange} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Updating..." : "Edit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
