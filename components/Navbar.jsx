"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Home, LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { firebase } from "@/lib/firebase";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Summary", href: "/", icon: BarChart3 },
  { label: "Predictions", href: "/", icon: Sparkles },
];

export default function Navbar({ userEmail }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await firebase.auth().signOut();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="text-lg font-semibold tracking-wide text-primary">Intense Technologies</div>

        <nav className="flex flex-wrap items-center gap-2 md:gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted hover:bg-secondary/80 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <span className="max-w-44 truncate text-sm text-muted md:max-w-64">{userEmail}</span>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}
