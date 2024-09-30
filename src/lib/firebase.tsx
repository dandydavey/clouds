import { initializeApp, FirebaseApp } from "firebase/app";
import { getDatabase, Database, ref, set, onValue, off } from "firebase/database";
import { getStorage, ref as storageRef, getDownloadURL } from "firebase/storage";

// Your Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyCCn9uhdV50IsMQWt8eUjlHjFEWQrEoIEA",
  authDomain: "clouds-d9cb3.firebaseapp.com",
  projectId: "clouds-d9cb3",
  storageBucket: "clouds-d9cb3.appspot.com",
  messagingSenderId: "258565240091",
  appId: "1:258565240091:web:5f0acd4dd8cbe56dd84fbe",
  measurementId: "G-XQZ4FDH91C",
};

let app: FirebaseApp;
let db: Database;
let storage: ReturnType<typeof getStorage>;

export function initializeFirebase() {
  if (!app) {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    storage = getStorage(app);
  }
}

export function updateScreenIndex(index: number) {
  if (!db) {
    throw new Error(
      "Firebase has not been initialized. Call initializeFirebase() first."
    );
  }
  const screenNumber = index % 2;
  const screenRef = ref(db, `screens/${screenNumber}`);
  return set(screenRef, { index: index });
}

export function listenToScreenIndex(screenNumber: number, callback: (index: number) => void) {
  if (!db) {
    throw new Error("Firebase has not been initialized. Call initializeFirebase() first.");
  }
  const screenRef = ref(db, `screens/${screenNumber}`);
  onValue(screenRef, (snapshot) => {
    const data = snapshot.val();
    if (data && typeof data.index === 'number') {
      callback(data.index);
    }
  });

  // Return a function to unsubscribe
  return () => off(screenRef);
}

export async function getVideoUrl(filename: string): Promise<string> {
  if (!storage) {
    throw new Error("Firebase has not been initialized. Call initializeFirebase() first.");
  }
  const videoRef = storageRef(storage, filename);
  try {
    const url = await getDownloadURL(videoRef);
    return url;
  } catch (error) {
    console.error("Error getting download URL:", error);
    throw error;
  }
}

export { db, storage };
