const token = process.env.TELEGRAM_BOT_TOKEN;
const baseUrl = process.env.VERCEL_BASE_URL;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!token || !baseUrl || !secret) {
  console.error("Isi TELEGRAM_BOT_TOKEN, VERCEL_BASE_URL, TELEGRAM_WEBHOOK_SECRET");
  process.exit(1);
}
const url = `${baseUrl.replace(/\\/$/, "")}/api/telegram-webhook`;
const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    url,
    secret_token: secret,
    allowed_updates: ["message"],
    drop_pending_updates: false
  })
});
const data = await response.json();
console.log(JSON.stringify(data, null, 2));
if (!data.ok) process.exit(1);
