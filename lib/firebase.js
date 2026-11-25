import admin from "firebase-admin";

let app;
function getApp() {
  if (app) return app;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Konfigurasi Firebase Admin belum lengkap");
  }
  app = admin.apps.length ? admin.app() : admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey })
  });
  return app;
}
export function db() {
  return getApp().firestore();
}
