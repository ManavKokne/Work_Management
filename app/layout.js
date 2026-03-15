import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: "Intense Technologies Task Manager",
  description: "Internal task and reporting dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  );
}
