import { bearer, json, readJson, safeEqual } from "../lib/security.js";
import { normalizeEvent } from "../lib/validation.js";
import { dispatch } from "../lib/notifications.js";

// This endpoint accepts a normalized event from an approved email automation/parser.
// It does not log in to or scrape the SRIKANDI mailbox.
export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { ok: false, error: "Method not allowed" });
  if (!safeEqual(bearer(req), process.env.EMAIL_ADAPTER_SECRET)) {
    return json(res, 401, { ok: false, error: "Unauthorized" });
  }
  try {
    const event = normalizeEvent({ ...(await readJson(req)), source: "SRIKANDI_EMAIL" });
    const result = await dispatch(event);
    return json(res, 200, { ok: true, ...result });
  } catch (error) {
    return json(res, 400, { ok: false, error: error.message });
  }
}
