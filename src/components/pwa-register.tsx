"use client";

import { useEffect, useState } from "react";
import { DownloadIcon, ShareIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useIsDark } from "@/lib/theme";

const DISMISS_KEY = "habiton-pwa-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || Boolean(nav.standalone);
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function PwaRegister() {
  const dark = useIsDark();
  const [install, setInstall] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const color = dark ? "#14121c" : "#f8f7fc";
    document.querySelectorAll('meta[name="theme-color"]').forEach((el) => {
      el.setAttribute("content", color);
    });
  }, [dark]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    let reloading = false;
    let ignoreFirstClaim = !navigator.serviceWorker.controller;
    const onControllerChange = () => {
      if (ignoreFirstClaim) {
        ignoreFirstClaim = false;
        return;
      }
      if (reloading || !navigator.serviceWorker.controller) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    let registration: ServiceWorkerRegistration | undefined;
    let offered = false;
    const offerUpdate = (reg: ServiceWorkerRegistration) => {
      if (offered || !navigator.serviceWorker.controller || !reg.waiting) return;
      offered = true;
      toast("نسخه جدید آماده است", {
        duration: Infinity,
        action: {
          label: "به‌روزرسانی",
          onClick: () => reg.waiting?.postMessage("SKIP_WAITING"),
        },
      });
    };

    navigator.serviceWorker.register("/sw.js").then((reg) => {
      registration = reg;
      offerUpdate(reg);
      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed") offerUpdate(reg);
        });
      });
    });

    const onVisible = () => {
      if (document.visibilityState === "visible") void registration?.update();
    };
    document.addEventListener("visibilitychange", onVisible);

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      dismissed = false;
    }
    if (!dismissed && !isStandalone() && isIos()) {
      setIosHint(true);
      setHidden(false);
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      let skip = false;
      try {
        skip = localStorage.getItem(DISMISS_KEY) === "1";
      } catch {
        skip = false;
      }
      if (skip || isStandalone()) return;
      setInstall(event as BeforeInstallPromptEvent);
      setIosHint(false);
      setHidden(false);
    };
    const onInstalled = () => setHidden(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Private mode can block storage. Hiding the banner is enough.
    }
    setHidden(true);
  }

  async function installApp() {
    if (!install) return;
    await install.prompt();
    const choice = await install.userChoice;
    setInstall(null);
    if (choice.outcome === "accepted") setHidden(true);
  }

  if (hidden || (!install && !iosHint)) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      style={{
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      <div className="mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-lg">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">نصب ردیاب عادت</p>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            {iosHint
              ? "در Safari دکمه اشتراک‌گذاری را بزن و «افزودن به صفحه اصلی» را انتخاب کن."
              : "مثل یک اپ روی دستگاه باز می‌شود، بدون نوار مرورگر."}
          </p>
        </div>
        {install && (
          <Button type="button" size="sm" onClick={installApp}>
            <DownloadIcon />
            نصب
          </Button>
        )}
        {iosHint && <ShareIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
        <Button type="button" variant="ghost" size="icon-sm" aria-label="بستن" onClick={dismiss}>
          <XIcon />
        </Button>
      </div>
    </div>
  );
}
