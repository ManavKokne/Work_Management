"use client";

import { useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";

const defaultForm = {
  cust_name: "",
  address: "",
  task_reported_by: "",
  engg_name: "",
  engg_email: "",
};

export default function NewTaskModal({ open, onOpenChange, onCreated }) {
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  const reportedAt = useMemo(() => new Date().toLocaleString(), [open]);

  function onChange(event) {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/create_task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to create task");
      }

      toast.success("Task created successfully");
      setForm(defaultForm);
      onOpenChange(false);
      onCreated();
    } catch (error) {
      toast.error(error.message || "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>Fill task details and assign the engineer.</DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="cust_name">Customer Name</Label>
            <Input
              id="cust_name"
              name="cust_name"
              value={form.cust_name}
              onChange={onChange}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              name="address"
              value={form.address}
              onChange={onChange}
              required
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="task_reported_by">Reported By</Label>
              <Input
                id="task_reported_by"
                name="task_reported_by"
                value={form.task_reported_by}
                onChange={onChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="engg_name">Engineer Name</Label>
              <Input
                id="engg_name"
                name="engg_name"
                value={form.engg_name}
                onChange={onChange}
                required
              />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="engg_email">Engineer Email</Label>
              <Input
                id="engg_email"
                name="engg_email"
                type="email"
                value={form.engg_email}
                onChange={onChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reported_datetime">Reported Datetime</Label>
              <Input id="reported_datetime" value={reportedAt} disabled />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Input id="status" value="Pending" disabled />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
