type AuthFailure = { code?: string; status?: number; message?: string };

export function signupFailure(error: AuthFailure) {
  if (error.status === 429 || error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
    return { category: "rate_limit", error: "Email requests are temporarily limited. Please wait and try again." };
  }
  if (error.code === "email_address_not_authorized") {
    return { category: "email_delivery", error: "Confirmation email delivery is not configured for this address. Please contact the project owner." };
  }
  // auth-js turns HTTP 500 responses into AuthRetryableFetchError and drops
  // their API code. Match only the public email error, not every backend 500.
  if (error.code === "smtp_error" || ((error.status ?? 0) >= 500 && /^Error sending confirmation email\.?$/i.test(error.message ?? ""))) {
    return { category: "email_delivery", error: "We couldn't send your confirmation email. Please contact the project owner so they can check the email service." };
  }
  if (error.code === "signup_disabled" || error.code === "email_provider_disabled") {
    return { category: "signup_disabled", error: "Email account creation is currently disabled. Please contact the project owner." };
  }
  if (error.code === "user_already_exists" || error.code === "email_exists") {
    return { category: "account_exists", error: "An account with this email already exists. Sign in instead." };
  }
  if (error.code === "weak_password") {
    return { category: "validation", error: "This password doesn't meet the account security requirements. Please choose a stronger password." };
  }
  if (error.code === "email_address_invalid") {
    return { category: "validation", error: "This email address cannot be used. Please enter a valid email address you can receive messages at." };
  }
  if ((error.status ?? 0) >= 500 || error.code === "unexpected_failure") {
    return { category: "backend", error: "The account service couldn't complete signup. Please try later or contact the project owner." };
  }
  if (error.status === 0) {
    return { category: "connection", error: "We couldn't connect to the account service. Please try again shortly." };
  }
  return { category: "unknown", error: "We couldn't create your account. Please try again shortly, or sign in if you already have one." };
}

export function authFailureDiagnostic(error: AuthFailure, category: string) {
  // Never log credentials, addresses, tokens, or raw provider error messages.
  return {
    category,
    code: error.code && /^[a-z_]{1,80}$/.test(error.code) ? error.code : "unavailable",
    status: Number.isInteger(error.status) ? error.status : null,
  };
}
