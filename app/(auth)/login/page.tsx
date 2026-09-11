import { AuthForm } from "@/components/auth/AuthForm";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <AuthForm mode="login" initialError={error === "confirmation" ? "This confirmation link is invalid, expired, or was opened in a different browser. Try signing in, or request a new confirmation by signing up again." : undefined} />;
}
