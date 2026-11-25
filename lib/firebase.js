import admin from "firebase-admin";

const databaseURL =
  "https://srikandi-lapas-ngaseman-default-rtdb.asia-southeast1.firebasedatabase.app";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    databaseURL,
  });
}

export const db = admin.database();
}
