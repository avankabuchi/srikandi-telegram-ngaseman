import { bearer, json, safeEqual } from "../lib/security.js";
import { sendText } from "../lib/telegram.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { ok: false, error: "Method not allowed" });
const receivedSecret = bearer(req);
const configuredSecret = process.env.ADMIN_TEST_SECRET || "";

if (!safeEqual(receivedSecret, configuredSecret)) {
  return json(res, 401, {
    ok: false,
    error: "Unauthorized",
    diagnostic: {
      envConfigured: Boolean(configuredSecret),
      envLength: configuredSecret.length,
      receivedLength: receivedSecret.length
    }
  });
}
  try {
    const message = "✅ Tes koneksi BOT PERSURATAN LAPAS NGASEMAN berhasil.";
    const group = process.env.TELEGRAM_GROUP_CHAT_ID;
    const leaders = (process.env.TELEGRAM_LEADER_CHAT_IDS || "").split(",").map(x => x.trim()).filter(Boolean);
    const targets = [...(group ? [group] : []), ...leaders];
    if (!targets.length) return json(res, 400, { ok: false, error: "Chat ID tujuan belum diatur" });
    const results = [];
    for (const id of targets) {
      try { await sendText(id, message); results.push({ chatId: id, ok: true }); }
      catch (e) { results.push({ chatId: id, ok: false, error: e.message }); }
    }
    return json(res, 200, { ok: results.some(x => x.ok), results });
  } catch (e) {
    return json(res, 500, { ok: false, error: e.message });
  }
}
