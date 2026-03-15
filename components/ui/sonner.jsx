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
        },
      }}
      {...props}
    />
  );
}
