import { AuthForm } from "@/components/auth/AuthForm";
import { headers } from "next/headers";
import { appOrigin } from "@/lib/auth/urls";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const origin = appOrigin(process.env.NEXT_PUBLIC_APP_URL);
  const host = (await headers()).get("host");
  if (host !== new URL(origin).host) return <AuthForm mode="login" canonicalUrl={origin + "/login"} />;
  return <AuthForm mode="login" initialError={error === "confirmation" ? "We couldn't finish signing you in from that link. Your email may already be confirmed: try your email and password below. If confirmation is still required, request a new link below and open it in the browser where you signed up." : undefined} />;
}
