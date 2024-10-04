import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getDatabase,
  Database,
  ref,
  set,
  get,
  onValue,
  off,
} from "firebase/database";
import {
  getStorage,
  ref as storageRef,
  getDownloadURL,
  uploadBytesResumable,
  UploadTask,
  deleteObject,
} from "firebase/storage";

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

export function updateIndex(index: number) {
  if (!db) {
    throw new Error(
      "Firebase has not been initialized. Call initializeFirebase() first."
    );
  }
  const cloudRef = ref(db, `clouds/clicked`);
  const timestamp = Date.now();
  return set(cloudRef, { timestamp, index });
}

export function listenToIndex(
  callback: (timestamp: number, index: number) => void
) {
  if (!db) {
    throw new Error(
      "Firebase has not been initialized. Call initializeFirebase() first."
    );
  }
  const cloudRef = ref(db, `clouds/clicked`);
  onValue(cloudRef, (snapshot) => {
    const data = snapshot.val();
    if (
      data &&
      typeof data.timestamp === "number" &&
      typeof data.index === "number"
    ) {
      callback(data.timestamp, data.index);
    }
  });

  // Return a function to unsubscribe
  return () => off(cloudRef);
}

export async function getVideoUrl(index: number): Promise<string> {
  if (!storage || !db) {
    throw new Error(
      "Firebase has not been initialized. Call initializeFirebase() first."
    );
  }

  const cloudToVideoRef = ref(db, `cloudToVideo/${index}`);
  const snapshot = await get(cloudToVideoRef);
  const filename = snapshot.val();

  if (!filename) {
    throw new Error(`No video found for index ${index}`);
  }

  const videoRef = storageRef(storage, `videos/${filename}`);
  try {
    const url = await getDownloadURL(videoRef);
    return url;
  } catch (error) {
    console.error("Error getting download URL:", error);
    throw error;
  }
}

export async function checkVideoExists(index: number): Promise<boolean> {
  if (!db) {
    throw new Error(
      "Firebase has not been initialized. Call initializeFirebase() first."
    );
  }
  const cloudToVideoRef = ref(db, `cloudToVideo/${index}`);
  const snapshot = await get(cloudToVideoRef);
  return snapshot.exists();
}

export async function uploadVideo(
  index: number | null,
  file: File,
  onProgress: (progress: number) => void,
  onComplete: () => void
): Promise<void> {
  if (!storage || !db) {
    throw new Error(
      "Firebase has not been initialized. Call initializeFirebase() first."
    );
  }

  // Delete existing video if any
  const cloudToVideoRef = ref(db, `cloudToVideo/${index}`);
  const snapshot = await get(cloudToVideoRef);
  let deletionTask: Promise<void> = Promise.resolve();
  if (snapshot.exists()) {
    const oldFilename = snapshot.val();
    const oldFileRef = storageRef(storage, `videos/${oldFilename}`);
    deletionTask = deleteObject(oldFileRef).catch((error) => {
      console.error("Error deleting old file:", error);
    });
  }

  // Create a reference for the new file
  const newFilename = `${Date.now()}_${file.name}`;
  const newFileRef = storageRef(storage, `videos/${newFilename}`);

  // Create an upload task
  const uploadTask: UploadTask = uploadBytesResumable(newFileRef, file);

  // Listen for state changes, errors, and completion of the upload
  uploadTask.on(
    "state_changed",
    (snapshot) => {
      // Calculate and report progress
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      onProgress(progress);
    },
    (error) => {
      console.error("Error uploading file:", error);
      onComplete(); // Call onComplete even if there's an error
    },
    async () => {
      console.log("Upload completed successfully");
      // Update the cloudToVideo mapping
      await set(cloudToVideoRef, newFilename);
      onComplete();
    }
  );

  // Wait for the upload and deletion to complete
  await Promise.all([uploadTask, deletionTask]);
}

export { db, storage };
