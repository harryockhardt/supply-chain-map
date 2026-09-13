import { AuthForm } from "@/components/auth/AuthForm";
import { headers } from "next/headers";
import { appOrigin } from "@/lib/auth/urls";

export default async function Signup() {
  const origin = appOrigin(process.env.NEXT_PUBLIC_APP_URL);
  const host = (await headers()).get("host");
  return <AuthForm mode="signup" canonicalUrl={host !== new URL(origin).host ? origin + "/signup" : undefined} />;
}
