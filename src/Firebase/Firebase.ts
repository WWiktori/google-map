import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDo-hST6QqIKTEntxaf3p88Tygf3m_5Z2s",
    authDomain: "map-25830.firebaseapp.com",
    projectId: "map-25830",
    storageBucket: "map-25830.firebasestorage.app",
    messagingSenderId: "1059059974352",
    appId: "1:1059059974352:web:8e16cf90d8d10330cb5ed5",
    measurementId: "G-KHWVKX3YX6"
  };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

