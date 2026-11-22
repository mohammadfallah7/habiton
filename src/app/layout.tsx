import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Toaster } from "@/components/ui/sonner";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { cn } from "@/lib/utils";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ردیاب عادت",
  description: "عادت‌های روزانه و هفتگی را ثبت کنید و زنجیره‌تان را نگه دارید.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f7fc" },
    { media: "(prefers-color-scheme: dark)", color: "#14121c" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the inline script below sets the theme class before React hydrates.
    <html lang="fa" dir="rtl" className={cn("font-sans", vazirmatn.variable)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-mesh">
        <DirectionProvider direction="rtl">{children}</DirectionProvider>
        <Toaster />
      </body>
    </html>
  );
}
