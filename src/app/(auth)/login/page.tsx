import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "ورود | ردیاب عادت" };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
