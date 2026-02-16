import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyACIzIFjHxZnKXmwCyIttcgdmzmVEsjo0o",
  authDomain: "instmates.firebaseapp.com",
  projectId: "instmates",
  storageBucket: "instmates.firebasestorage.app",
  messagingSenderId: "417095841554",
  appId: "1:417095841554:web:0ffa2bd04471845537a5cb",
  measurementId: "G-L57QYT7H9F"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
