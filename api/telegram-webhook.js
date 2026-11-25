import { json, readJson, safeEqual } from "../lib/security.js";
import { telegram, sendText } from "../lib/telegram.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { ok: false, error: "Method not allowed" });
  if (!safeEqual(req.headers["x-telegram-bot-api-secret-token"], process.env.TELEGRAM_WEBHOOK_SECRET)) {
    return json(res, 401, { ok: false, error: "Unauthorized" });
  }
  try {
    const update = await readJson(req);
    const message = update.message;
    const text = message?.text || "";
    const chatId = message?.chat?.id;
    if (chatId && text.startsWith("/start")) {
      await sendText(chatId,
        "BOT PERSURATAN LAPAS NGASEMAN aktif.\\n" +
        `Telegram Chat ID Anda: ${chatId}\\n\\n` +
        "Sampaikan Chat ID ini kepada administrator untuk didaftarkan sebagai penerima notifikasi pimpinan."
      );
    } else if (chatId && text === "/id") {
      await sendText(chatId, `Chat ID: ${chatId}`);
    }
    return json(res, 200, { ok: true });
  } catch (e) {
    return json(res, 200, { ok: false, error: e.message });
  }
}
