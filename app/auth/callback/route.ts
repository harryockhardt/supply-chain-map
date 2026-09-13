import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { appOrigin } from "@/lib/auth/urls";

export async function GET(request: NextRequest) {
  const origin = appOrigin(process.env.NEXT_PUBLIC_APP_URL);
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(new URL("/map", origin));
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }
  }
  const response = NextResponse.redirect(new URL("/login?error=confirmation", origin));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
