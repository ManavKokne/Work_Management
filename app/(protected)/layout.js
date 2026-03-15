"use client";

import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedLayout({ children }) {
  const { user } = useAuth();

  return (
    <AuthGuard>
      <div className="dashboard-shell min-h-screen">
        <Navbar userEmail={user?.email || ""} />
        {children}
      </div>
    </AuthGuard>
  );
}
