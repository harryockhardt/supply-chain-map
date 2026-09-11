import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/", "/login", "/signup", "/map/:path*", "/incidents/:path*", "/my-incidents/:path*", "/admin/:path*", "/auth/:path*"],
};
