const allowedTypes = new Set(["surat_masuk", "surat_keluar", "disposisi", "pengingat"]);

export function normalizeEvent(input) {
  if (!input || typeof input !== "object") throw new Error("Payload harus berupa objek");
  const eventId = String(input.eventId || input.id || "").trim();
  const type = String(input.type || "").trim().toLowerCase();
  const number = String(input.number || input.nomorSurat || "").trim();
  const subject = String(input.subject || input.perihal || "").trim();
  const date = String(input.date || input.tanggal || "").trim();
  const sender = String(input.sender || input.asal || input.dari || "").trim();
  const status = String(input.status || "").trim();
  if (!eventId || !/^[A-Za-z0-9._:-]{3,160}$/.test(eventId)) throw new Error("eventId wajib (3-160 karakter)");
  if (!allowedTypes.has(type)) throw new Error("type tidak dikenal");
  if (!number || !subject) throw new Error("number dan subject wajib diisi");
  return {
    eventId, type,
    number: number.slice(0, 120),
    subject: subject.slice(0, 240),
    date: date.slice(0, 40),
    sender: sender.slice(0, 180),
    status: status.slice(0, 100),
    source: String(input.source || "SRIKANDI").slice(0, 50),
    url: safeUrl(input.url),
    createdAt: new Date().toISOString()
  };
}

function safeUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(String(value));
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}
