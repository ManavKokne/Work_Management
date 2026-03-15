"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster(props) {
  return (
    <Sonner
      theme="light"
      toastOptions={{
        classNames: {
          toast: "border border-border",
          title: "text-foreground",
          description: "text-muted",
          closeButton:
            "right-2 top-2 flex h-6 w-6 items-center justify-center rounded-sm border border-border/50 bg-card text-foreground hover:bg-secondary",
        },
      }}
      {...props}
    />
  );
}
