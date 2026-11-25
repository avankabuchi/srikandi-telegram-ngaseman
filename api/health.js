import { json } from "../lib/security.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { ok: false, error: "Method not allowed" });
  return json(res, 200, { ok: true, service: "SRIKANDI Telegram Gateway", time: new Date().toISOString() });
}
