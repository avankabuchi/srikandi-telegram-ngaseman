import { bearer, json, readJson, safeEqual } from "../lib/security.js";
import { normalizeEvent } from "../lib/validation.js";
import { dispatch } from "../lib/notifications.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { ok: false, error: "Method not allowed" });
  if (!safeEqual(bearer(req), process.env.SRIKANDI_WEBHOOK_SECRET)) {
    return json(res, 401, { ok: false, error: "Unauthorized" });
  }
  try {
    const event = normalizeEvent(await readJson(req));
    const result = await dispatch(event);
    return json(res, 200, { ok: true, ...result });
  } catch (error) {
    return json(res, 400, { ok: false, error: error.message });
  }
}
