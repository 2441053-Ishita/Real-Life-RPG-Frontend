import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDaxcYrWASgGEg214mkaRqOI8-QzVmCH2Y",
  authDomain: "real-life-rpg-45902.firebaseapp.com",
  projectId: "real-life-rpg-45902",
  storageBucket: "real-life-rpg-45902.firebasestorage.app",
  messagingSenderId: "215228938828",
  appId: "1:215228938828:web:45ed2358d30e71de2152e9",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
})();

export const db = getFirestore(app);

export default app;