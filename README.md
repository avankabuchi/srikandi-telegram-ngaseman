# SRIKANDI Telegram Gateway — Lapas Kelas IIA Ngaseman

Template integrasi notifikasi SRIKANDI V3 ke grup Telegram dan akun Telegram pimpinan.

## Status dan batas integrasi

SRIKANDI V3 memiliki fitur API Management dan notifikasi email. Namun, endpoint, skema autentikasi, hak akses, serta format event API untuk instansi harus diperoleh dari administrator/helpdesk SRIKANDI. Proyek ini **tidak** menebak endpoint internal SRIKANDI, tidak melakukan scraping, dan tidak menyimpan kredensial login SRIKANDI.

`/api/srikandi-event` adalah endpoint penerima event generik. Setelah spesifikasi resmi diterima, sesuaikan pemetaan field di `lib/validation.js` atau buat adapter sesuai kontrak API yang diberikan.

`/api/email-event` menerima event yang sudah dinormalisasi dari layanan otomasi/parser email yang disetujui. Endpoint ini bukan koneksi IMAP/Gmail langsung dan tidak membaca mailbox sendiri. Pilih penyedia email/otomasi yang disetujui instansi dan konfigurasi forwarding/webhook secara aman.

## 1. Prasyarat

- Node.js 20+
- Akun Vercel dan repository Git
- Bot Telegram dibuat melalui @BotFather
- Firebase project dengan Firestore aktif
- Firebase service account khusus server (jangan gunakan kredensial client)
- Izin resmi integrasi SRIKANDI dari admin/pengelola

## 2. Konfigurasi Firebase

1. Buat project Firebase atau gunakan project instansi yang telah disetujui.
2. Aktifkan Cloud Firestore.
3. Buat service account khusus backend melalui Firebase Console > Project settings > Service accounts.
4. Salin `project_id`, `client_email`, dan `private_key`.
5. Jangan pernah commit file JSON service account ke Git.

Koleksi `srikandiTelegramEvents` dibuat otomatis saat event pertama diproses. Terapkan aturan akses Firestore yang menolak akses client publik; akses backend dilakukan melalui Firebase Admin SDK.

## 3. Buat bot dan siapkan Chat ID

1. Telegram > `@BotFather` > `/newbot`.
2. Simpan token bot.
3. Tambahkan bot ke grup notifikasi. Berikan izin mengirim pesan.
4. Untuk pimpinan, minta pimpinan membuka bot dan menekan Start.
5. Deploy proyek, atur webhook (langkah 6), lalu pimpinan kirim `/start` atau `/id`.
6. Catat Chat ID yang dibalas bot. Masukkan ke `TELEGRAM_LEADER_CHAT_IDS` sebagai daftar dipisahkan koma.

Untuk grup, cara praktis mengambil ID adalah menggunakan bot webhook ini setelah deploy: kirim pesan di grup setelah bot ditambahkan, lalu gunakan mekanisme admin yang disetujui untuk melihat update/log. Alternatif: gunakan bot utilitas internal yang telah disetujui atau Telegram Bot API `getUpdates` sebelum webhook dipasang. Jangan publikasikan ID grup secara terbuka.

## 4. Variabel lingkungan Vercel

Buka Vercel Project > Settings > Environment Variables. Tambahkan semua variabel dari `.env.example`.

Buat secret acak panjang (minimal 32 karakter) untuk:
- `SRIKANDI_WEBHOOK_SECRET`
- `EMAIL_ADAPTER_SECRET`
- `ADMIN_TEST_SECRET`
- `TELEGRAM_WEBHOOK_SECRET`

`TELEGRAM_LEADER_CHAT_IDS` berisi ID numerik dipisahkan koma, contoh format: `123456789,987654321` (gunakan ID nyata milik penerima yang telah menyetujui).

`FIREBASE_PRIVATE_KEY` harus disimpan sebagai environment variable multiline atau dengan newline yang di-escape `\\n`.

Setelah menambahkan/mengubah environment variables, lakukan redeploy.

## 5. Deploy ke Vercel

```bash
npm install
npx vercel login
npx vercel
```

Pilih/tautkan project Vercel, tambahkan environment variables melalui dashboard, kemudian deploy production:

```bash
npx vercel --prod
```

Uji:
```bash
curl https://NAMA-PROJECT.vercel.app/api/health
```

## 6. Pasang webhook Telegram

Atur `VERCEL_BASE_URL` sementara di terminal, lalu jalankan:
```bash
VERCEL_BASE_URL=https://NAMA-PROJECT.vercel.app npm run telegram:setup
```
Atau panggil Telegram Bot API `setWebhook` secara aman dengan URL:
`https://NAMA-PROJECT.vercel.app/api/telegram-webhook`
dan `secret_token` yang sama dengan `TELEGRAM_WEBHOOK_SECRET`.

## 7. Uji pengiriman Telegram

```bash
curl -X POST https://NAMA-PROJECT.vercel.app/api/admin-test \
  -H "Authorization: Bearer ADMIN_TEST_SECRET_ANDA" \
  -H "Content-Type: application/json"
```

Ganti nilai token dengan secret sebenarnya. Jangan tempelkan token ke tiket publik atau chat grup.

## 8. Uji event simulasi

```bash
curl -X POST https://NAMA-PROJECT.vercel.app/api/srikandi-event \
  -H "Authorization: Bearer SRIKANDI_WEBHOOK_SECRET_ANDA" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "uji-2026-0001",
    "type": "surat_masuk",
    "number": "B/123/UM.01/2026",
    "subject": "Undangan rapat koordinasi",
    "sender": "Kantor Wilayah",
    "date": "2026-11-25",
    "status": "Menunggu disposisi"
  }'
```

Jenis event yang didukung:
- `surat_masuk`
- `surat_keluar`
- `disposisi`
- `pengingat`

`eventId` wajib unik dan stabil untuk deduplikasi. Jika SRIKANDI menyediakan ID event, gunakan ID itu. Jangan membuat ID acak setiap retry.

## 9. Hubungkan API Management SRIKANDI

Di menu API Management, mintalah/siapkan:
- Dokumentasi OpenAPI/Swagger atau dokumen integrasi resmi.
- Base URL dan environment (uji/produksi).
- Metode autentikasi (OAuth2/API key/mTLS/dll).
- Endpoint event atau mekanisme polling yang disetujui.
- Field ID naskah, jenis peristiwa, nomor, perihal, tanggal, status, unit tujuan.
- Kebijakan IP allowlist, rate limit, dan retensi data.

Jika API Management hanya memberikan API untuk mengambil data (bukan webhook), integrasi memerlukan mekanisme polling terjadwal. Vercel Cron dapat dipakai sesuai paket/kuota dan batas durasi; implementasi polling baru dibuat setelah endpoint, token flow, pagination, dan cursor resmi diketahui.

Pemetaan contoh payload SRIKANDI ke format internal:
```json
{
  "eventId": "ID_EVENT_UNIK_DARI_SUMBER",
  "type": "surat_masuk",
  "number": "B/123/UM.01/2026",
  "subject": "Perihal surat",
  "sender": "Instansi pengirim",
  "date": "2026-11-25",
  "status": "Menunggu disposisi",
  "url": "https://tautan-resmi-jika-disediakan"
}
```

## 10. Jalur email

Aktifnya notifikasi email SRIKANDI belum otomatis berarti email dapat diteruskan langsung ke endpoint Vercel. Pilih salah satu mekanisme yang diizinkan pengelola email instansi:
- layanan email gateway yang menyediakan webhook;
- automation resmi yang dapat mem-parse email dan mengirim JSON ke `/api/email-event`;
- integrasi Gmail API/Graph API dengan OAuth dan persetujuan administrator.

Jangan gunakan auto-forward ke alamat pihak ketiga tanpa persetujuan instansi. Jangan mengirim lampiran atau isi surat rahasia ke Telegram.

## 11. Keamanan wajib sebelum produksi

- Kirim hanya metadata minimum; jangan kirim isi surat, lampiran, NIK, data warga binaan, atau informasi keamanan.
- Batasi grup Telegram untuk petugas berwenang; evaluasi keanggotaan secara berkala.
- Gunakan HTTPS dan secret terpisah untuk setiap sumber.
- Simpan token di Vercel Environment Variables, bukan source code.
- Batasi akses Firestore; jangan buat database publik.
- Terapkan kebijakan retensi log dan audit sesuai ketentuan instansi.
- Tambahkan retry terkontrol untuk kegagalan sementara. Saat ini endpoint mencatat kegagalan tujuan; proses retry terjadwal perlu ditambahkan sebelum mengandalkan pengiriman kritikal.
- Uji di lingkungan non-produksi dan dapatkan persetujuan pejabat/pengelola sistem sebelum menghubungkan data kedinasan.

## 12. Catatan implementasi

Template ini menyediakan gateway webhook, validasi, deduplikasi dasar, pengiriman ke beberapa chat, webhook Telegram, dan pencatatan Firestore. Ini belum merupakan konektor SRIKANDI produksi karena kontrak API spesifik instansi belum diberikan. Sebelum go-live, lengkapi adapter API/email, retry queue, monitoring, dan pengujian keamanan.
