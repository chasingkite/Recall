import { NextResponse } from "next/server";
import { createClient } from "../../lib/supabase/server";

// OAuth return point. On any failure, send the user back to /login with an error code instead of
// silently landing on "/" with no session (the middleware would bounce them to /login anyway, with
// no message and no log, and they would have to click "Sign in" a second time).
export async function GET(request: Request) {
  const { searchParams, origin, host } = new URL(request.url);
  const code = searchParams.get("code");
  const providerError = searchParams.get("error_description") || searchParams.get("error");
  const fail = (reason: string) => NextResponse.redirect(`${origin}/login?error=${reason}`);

  if (providerError) {
    console.error("[auth/callback] provider returned an error:", providerError, "| host:", host);
    return fail("provider");
  }
  if (!code) {
    console.error("[auth/callback] callback reached without a code | host:", host);
    return fail("missing_code");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    // Never log the code or tokens — only the reason and the host (a host mismatch between where
    // sign-in started and where Google returned is the usual cause of a missing PKCE cookie).
    console.error("[auth/callback] code exchange failed:", error.message, "| host:", host);
    return fail("exchange");
  }

  return NextResponse.redirect(origin);
}
