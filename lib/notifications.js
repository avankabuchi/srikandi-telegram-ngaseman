import { db } from "./firebase.js";
import { sendText } from "./telegram.js";

const titles = {
  surat_masuk: "SURAT MASUK BARU",
  surat_keluar: "SURAT KELUAR",
  disposisi: "DISPOSISI BARU",
  pengingat: "PENGINGAT TINDAK LANJUT"
};

function formatMessage(event) {
  const institution = process.env.INSTITUTION_NAME || "Unit Kerja";
  const lines = [
    `🔔 ${titles[event.type]}`,
    institution,
    "",
    `Nomor: ${event.number}`,
    `Perihal: ${event.subject}`,
    event.sender ? `Asal/Tujuan: ${event.sender}` : null,
    event.date ? `Tanggal: ${event.date}` : null,
    event.status ? `Status: ${event.status}` : null,
    "",
    "Notifikasi otomatis. Silakan buka SRIKANDI untuk melihat detail resmi."
  ].filter(Boolean);
  if (event.url) lines.splice(lines.length - 1, 0, `Tautan: ${event.url}`);
  return lines.join("\n");
}

export async function dispatch(event) {
 const firestore = db;
  const ref = firestore.collection("srikandiTelegramEvents").doc(event.eventId);
  const reservation = await firestore.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      const old = snap.data();
      if (old.state === "sent" || old.state === "processing") return { duplicate: true };
      tx.set(ref, { state: "processing", updatedAt: new Date() }, { merge: true });
      return { duplicate: false, previous: old };
    }
    tx.create(ref, {
      ...event,
      state: "processing",
      createdAt: new Date(),
      destinations: {}
    });
    return { duplicate: false, previous: null };
  });
  if (reservation.duplicate) return { duplicate: true };

  const groupId = process.env.TELEGRAM_GROUP_CHAT_ID;
  const leaders = (process.env.TELEGRAM_LEADER_CHAT_IDS || "")
    .split(",").map(x => x.trim()).filter(Boolean);
  const targets = [
    ...(groupId ? [{ key: "group", chatId: groupId }] : []),
    ...leaders.map((chatId, i) => ({ key: `leader_${i + 1}`, chatId }))
  ];

  const previous = reservation.previous?.destinations || {};
  const outcomes = { ...previous };
  const message = formatMessage(event);

  for (const target of targets) {
    if (outcomes[target.key]?.ok) continue;
    try {
      await sendText(target.chatId, message);
      outcomes[target.key] = { ok: true };
    } catch (error) {
      outcomes[target.key] = { ok: false, error: String(error.message).slice(0, 300) };
    }
  }
  const values = Object.values(outcomes);
  const allSuccess = targets.length > 0 && targets.every(t => outcomes[t.key]?.ok);
  const anySuccess = values.some(x => x.ok);
  const state = allSuccess ? "sent" : anySuccess ? "partial" : "failed";

  await ref.set({
    state,
    destinations: outcomes,
    updatedAt: new Date(),
    ...(allSuccess ? { sentAt: new Date() } : {})
  }, { merge: true });

  return { duplicate: false, state, outcomes };
}
