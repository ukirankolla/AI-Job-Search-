import { LoginForm } from "@/components/LoginForm";

export const metadata = { title: "Sign in | AI Job Search" };

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-6xl px-4">
      <LoginForm />
    </main>
  );
}
