"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Home, LogOut, Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { firebase } from "@/lib/firebase";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Summary", href: "/summary", icon: BarChart3 },
  { label: "Predictions", href: "/predictions", icon: Sparkles },
];

export default function Navbar({ userEmail }) {
  const [logoMissing, setLogoMissing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await firebase.auth().signOut();
    router.replace("/login");
  }

  async function handleMobileSignOut() {
    setMobileMenuOpen(false);
    await handleSignOut();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
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

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <nav className="hidden flex-wrap items-center gap-4 lg:flex">
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

        <div className="hidden items-center gap-3 lg:flex">
          <span className="max-w-44 truncate text-sm text-muted md:max-w-64">{userEmail}</span>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent className="left-auto! right-0! top-0! h-full! w-[88vw]! max-w-sm! translate-x-0! translate-y-0! rounded-none border-l border-border p-0">
          <div className="flex h-full flex-col">
            <DialogHeader className="border-b border-border px-5 pb-3 pt-5 pr-10">
              <DialogTitle className="text-base">Menu</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <nav className="grid gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={`mobile-${item.label}`}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "relative inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-accent",
                        "after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:origin-left after:rounded-full after:bg-[#1f5da8] after:transition-transform after:duration-250",
                        isActive && "bg-primary/5 after:scale-x-100",
                        !isActive && "after:scale-x-0 hover:bg-primary/5 hover:after:scale-x-100"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="border-t border-border px-5 py-4">
              <p className="mb-3 truncate text-sm text-muted">{userEmail}</p>
              <Button variant="outline" size="sm" className="w-full justify-center" onClick={handleMobileSignOut}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
