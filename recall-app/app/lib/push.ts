import webpush from "web-push";

let configured = false;

/**
 * Returns the web-push client with VAPID details configured lazily.
 *
 * `setVapidDetails` must NOT run at module scope — it throws
 * "No subject set in vapidDetails.subject" during Next.js's build-time config
 * collection when the VAPID env vars are absent, failing the production build.
 * Configuring on first use (request time) avoids that.
 */
export function getWebPush() {
  if (!configured) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
    configured = true;
  }
  return webpush;
}
