import webpush from "web-push";

let configured = false;
function ensureConfigured() {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false; // push simply no-ops until keys are set
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:hello@peeyashstudy.com",
    publicKey,
    privateKey
  );
  configured = true;
  return true;
}

// Sends a push notification to every device a user has subscribed on.
// Silently cleans up subscriptions that are no longer valid (e.g. the user
// uninstalled the app or cleared browser data) instead of erroring out.
export async function sendPushToUser(admin, userId, { title, body, url }) {
  if (!ensureConfigured()) return; // VAPID keys not set yet — skip quietly
  const { data: subs } = await admin.from("push_subscriptions").select("*").eq("user_id", userId);
  if (!subs?.length) return;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify({ title, body, url })
        );
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    })
  );
}
