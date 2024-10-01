import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getDatabase,
  Database,
  ref,
  set,
  onValue,
  off,
} from "firebase/database";
import {
  getStorage,
  ref as storageRef,
  getDownloadURL,
  uploadBytesResumable,
  UploadTask,
  listAll,
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
  return set(cloudRef, { index: index });
}

export function listenToIndex(callback: (index: number) => void) {
  if (!db) {
    throw new Error(
      "Firebase has not been initialized. Call initializeFirebase() first."
    );
  }
  const cloudRef = ref(db, `clouds/clicked`);
  onValue(cloudRef, (snapshot) => {
    const data = snapshot.val();
    if (data && typeof data.index === "number") {
      callback(data.index);
    }
  });

  // Return a function to unsubscribe
  return () => off(cloudRef);
}

export async function getVideoUrl(index: number): Promise<string> {
  if (!storage) {
    throw new Error(
      "Firebase has not been initialized. Call initializeFirebase() first."
    );
  }

  const videoRef = storageRef(storage, `videos/${index}`);
  try {
    const files = await listAll(videoRef);
    if (files.items.length === 0) {
      throw new Error(`No video found for index ${index}`);
    }
    const url = await getDownloadURL(files.items[0]);
    return url;
  } catch (error) {
    console.error("Error getting download URL:", error);
    throw error;
  }
}

export async function checkVideoExists(index: number): Promise<boolean> {
  if (!storage) {
    throw new Error(
      "Firebase has not been initialized. Call initializeFirebase() first."
    );
  }
  const folderRef = storageRef(storage, `videos/${index}`);

  try {
    const result = await listAll(folderRef);
    console.log(result);
    return result.items.length > 0;
  } catch (error) {
    if (error.code === "storage/object-not-found") {
      return false;
    }
    throw error;
  }
}

export async function uploadVideo(
  index: number | null,
  file: File,
  onProgress: (progress: number) => void,
  onComplete: () => void
): Promise<void> {
  if (!storage) {
    throw new Error(
      "Firebase has not been initialized. Call initializeFirebase() first."
    );
  }

  const folderRef = storageRef(storage, `videos/${index}`);

  // Start deletion of existing files without awaiting
  const deletionTask = listAll(folderRef)
    .then((existingFiles) => {
      existingFiles.items.forEach((fileRef) => {
        deleteObject(fileRef).catch((error) => {
          console.error("Error deleting file:", fileRef.fullPath, error);
        });
      });
    })
    .catch((error) => {
      console.error("Error listing files for deletion:", error);
    });

  // Create a reference for the new file
  const newFileRef = storageRef(storage, `videos/${index}/${file.name}`);

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
    () => {
      console.log("Upload completed successfully");
      onComplete();
    }
  );

  // Wait for the upload to complete
  await Promise.all([uploadTask, deletionTask]);
}

export { db, storage };
