"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useIsDark } from "@/lib/theme";

export function Toaster(props: ToasterProps) {
  const isDark = useIsDark();
  return (
    <Sonner
      theme={isDark ? "dark" : "light"}
      dir="rtl"
      position="top-center"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius-xl)",
          fontFamily: "var(--font-sans)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}
