"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Home, LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { firebase } from "@/lib/firebase";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Summary", href: "/summary", icon: BarChart3 },
  { label: "Predictions", href: "/predictions", icon: Sparkles },
];

export default function Navbar({ userEmail }) {
  const [logoMissing, setLogoMissing] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await firebase.auth().signOut();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
        <Link href="/" className="inline-flex items-center">
          {logoMissing ? (
            <span className="text-lg font-semibold tracking-wide text-accent">Intense Technologies</span>
          ) : (
            <img
              src="/intense-logo.png"
              alt="Intense Technologies"
              className="h-11 w-auto max-w-68 object-contain mix-blend-multiply"
              onError={() => setLogoMissing(true)}
            />
          )}
        </Link>

        <nav className="flex flex-wrap items-center gap-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "relative inline-flex items-center gap-2 bg-transparent px-2 py-1.5 text-sm font-medium text-accent transition-colors hover:text-accent",
                  "after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:origin-left after:rounded-full after:bg-[#1f5da8] after:transition-transform after:duration-250",
                  isActive && "after:scale-x-100",
                  !isActive && "after:scale-x-0 hover:after:scale-x-100"
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
