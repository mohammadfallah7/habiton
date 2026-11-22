"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeOffIcon, LoaderCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const ERRORS: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "ایمیل یا رمز عبور درست نیست.",
  USER_ALREADY_EXISTS: "با این ایمیل قبلاً ثبت‌نام شده است.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "با این ایمیل قبلاً ثبت‌نام شده است.",
  INVALID_EMAIL: "ایمیل معتبر نیست.",
  PASSWORD_TOO_SHORT: "رمز عبور باید حداقل ۸ کاراکتر باشد.",
  PASSWORD_TOO_LONG: "رمز عبور خیلی طولانی است.",
  TOO_MANY_REQUESTS: "تلاش‌های زیاد. کمی بعد دوباره امتحان کن.",
};

function messageFor(error: { code?: string; message?: string }) {
  return (error.code && ERRORS[error.code]) || "مشکلی پیش آمد. دوباره تلاش کن.";
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const { error } = isRegister
        ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
        : await authClient.signIn.email({ email: email.trim(), password });
      if (error) {
        setError(messageFor(error));
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("اتصال برقرار نشد. اینترنت را بررسی کن.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="animate-rise space-y-7">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {isRegister ? "ساخت حساب" : "خوش برگشتی 👋"}
        </h1>
        <p className="text-muted-foreground">
          {isRegister ? "چند ثانیه وقت می‌گیرد و رایگان است." : "برای ادامه وارد حسابت شو."}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate={false}>
        {isRegister && (
          <div className="grid gap-2">
            <Label htmlFor="name">نام</Label>
            <Input
              id="name"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="نام و نام خانوادگی"
              className="h-11 text-base"
            />
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="email">ایمیل</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-11 text-start text-base"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">رمز عبور</Label>
          <div className="relative" dir="ltr">
            <Input
              id="password"
              type={show ? "text" : "password"}
              required
              minLength={8}
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="حداقل ۸ کاراکتر"
              className="h-11 pe-11 text-base"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "پنهان کردن رمز" : "نمایش رمز"}
              className="absolute inset-y-0 end-0 grid w-11 place-items-center rounded-e-lg text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {show ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="h-11 w-full rounded-xl text-base shadow-lg shadow-primary/25" disabled={pending}>
          {pending && <LoaderCircleIcon className="animate-spin" />}
          {isRegister ? "ساخت حساب" : "ورود"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {isRegister ? "قبلاً ثبت‌نام کرده‌ای؟" : "حساب نداری؟"}{" "}
        <Link href={isRegister ? "/login" : "/register"} className="font-semibold text-primary hover:underline">
          {isRegister ? "ورود" : "ثبت‌نام"}
        </Link>
      </p>
    </div>
  );
}
