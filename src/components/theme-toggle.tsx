"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setTheme, useIsDark } from "@/lib/theme";

export function ThemeToggle() {
  const isDark = useIsDark();
  return (
    <Button
      variant="ghost"
      size="icon-lg"
      className="rounded-full"
      aria-label={isDark ? "حالت روشن" : "حالت تاریک"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <SunIcon className="hidden dark:block" />
      <MoonIcon className="dark:hidden" />
    </Button>
  );
}
