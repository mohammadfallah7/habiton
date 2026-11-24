"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlameIcon, LoaderCircleIcon, LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { authClient } from "@/lib/auth-client";

export function AppHeader({ name }: { name: string }) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  async function signOut() {
    setLeaving(true);
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/50 bg-background/70 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-violet-600 to-fuchsia-500 text-white shadow-md shadow-primary/30">
            <FlameIcon className="size-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">ردیاب عادت</span>
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
          <div className="flex items-center gap-2 ps-1">
            <span
              className="grid size-9 place-items-center rounded-full bg-accent text-sm font-bold text-accent-foreground"
              aria-hidden
            >
              {name.trim().charAt(0) || "؟"}
            </span>
            <span className="hidden max-w-32 truncate text-sm font-medium sm:block">{name}</span>
          </div>
          <Button
            variant="ghost"
            size="icon-lg"
            className="rounded-full"
            aria-label="خروج از حساب"
            title="خروج"
            onClick={signOut}
            disabled={leaving}
          >
            {leaving ? <LoaderCircleIcon className="animate-spin" /> : <LogOutIcon className="rtl:-scale-x-100" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
