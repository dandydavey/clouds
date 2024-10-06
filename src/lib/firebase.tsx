import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getDatabase,
  Database,
  ref,
  set,
  onValue,
  DataSnapshot,
  off,
} from "firebase/database";
import {
  getStorage,
  ref as storageRef,
  getDownloadURL,
  uploadBytesResumable,
  UploadTask,
  listAll,
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

export async function getVideoUrl(filename: string): Promise<string> {
  if (!storage) {
    throw new Error(
      "Firebase has not been initialized. Call initializeFirebase() first."
    );
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

export async function uploadVideo(
  file: File,
  onProgress: (progress: number) => void,
  onComplete: () => void
): Promise<void> {
  if (!storage || !db) {
    throw new Error(
      "Firebase has not been initialized. Call initializeFirebase() first."
    );
  }

  const newFileRef = storageRef(storage, `videos/${file.name}`);

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
      onComplete();
    }
  );

  // Wait for the upload to complete
  await uploadTask;
}

export async function getRandomVideo(): Promise<string> {
  if (!storage) {
    throw new Error(
      "Firebase has not been initialized. Call initializeFirebase() first."
    );
  }
  const videosRef = storageRef(storage, "videos");

  try {
    const result = await listAll(videosRef);
    if (result.items.length === 0) {
      throw new Error("No videos available");
    }

    const randomIndex = Math.floor(Math.random() * result.items.length);
    const randomVideoRef = result.items[randomIndex];

    // Return just the filename
    return randomVideoRef.name;
  } catch (error) {
    console.error("Error getting random video filename:", error);
    throw error;
  }
}

export async function updateCloudToVideoMapping(
  mapping: Record<number, string>
): Promise<void> {
  if (!db) {
    throw new Error(
      "Firebase has not been initialized. Call initializeFirebase() first."
    );
  }
  const cloudToVideoRef = ref(db, "indexToVideo");
  try {
    await set(cloudToVideoRef, mapping);
    console.log("Cloud to video mapping updated successfully");
  } catch (error) {
    console.error("Error updating cloud to video mapping:", error);
    throw error;
  }
}

export function listenToCloudToVideo(
  callback: (mapping: Record<number, string>) => void
) {
  if (!db) {
    throw new Error(
      "Firebase has not been initialized. Call initializeFirebase() first."
    );
  }
  const cloudToVideoRef = ref(db, "indexToVideo");
  onValue(cloudToVideoRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data as Record<number, string>);
    }
  });

  // Return a function to unsubscribe
  return () => off(cloudToVideoRef);
}

export { db, storage };

export async function checkVideoExists(filename: string): Promise<boolean> {
  if (!storage) {
    throw new Error(
      "Firebase has not been initialized. Call initializeFirebase() first."
    );
  }

  const videoRef = storageRef(storage, `videos/${filename}`);
  try {
    await getDownloadURL(videoRef);
    return true;
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error) {
      if (error.code === "storage/object-not-found") {
        return false;
      }
    }
    console.error("Error checking if video exists:", error);
    throw error;
  }
}

export async function sendToPlayer(
  filename: string,
  playerIndex: number
): Promise<void> {
  if (!db) {
    throw new Error(
      "Firebase has not been initialized. Call initializeFirebase() first."
    );
  }
  const playerRef = ref(db, `player/${playerIndex}`);
  try {
    await set(playerRef, { filename });
    console.log(`Sent ${filename} to player ${playerIndex}`);
  } catch (error) {
    console.error(`Error sending ${filename} to player ${playerIndex}:`, error);
    throw error;
  }
}

export function listenToPlayer(
  playerIndex: number,
  callback: (filename: string | null) => void
) {
  if (!db) {
    throw new Error(
      "Firebase has not been initialized. Call initializeFirebase() first."
    );
  }
  const playerRef = ref(db, `player/${playerIndex}`);

  const handleSnapshot = (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    if (data && typeof data.filename === "string") {
      callback(data.filename);
    } else {
      callback(null);
    }
  };

  onValue(playerRef, handleSnapshot);

  // Return a function to unsubscribe
  return () => off(playerRef, "value", handleSnapshot);
}

export function listenToIdlePlayers(
  callback: (idlePlayers: number[]) => void
) {
  if (!db) {
    throw new Error(
      "Firebase has not been initialized. Call initializeFirebase() first."
    );
  }
  const idlePlayersRef = ref(db, "players/idle");

  onValue(idlePlayersRef, (snapshot) => {
    const data = snapshot.val();
    if (Array.isArray(data)) {
      callback(data);
    } else {
      callback([]);
    }
  });

  // Return a function to unsubscribe
  return () => off(idlePlayersRef);
}

export async function updateIdlePlayers(idlePlayers: number[]): Promise<void> {
  if (!db) {
    throw new Error(
      "Firebase has not been initialized. Call initializeFirebase() first."
    );
  }
  const idlePlayersRef = ref(db, "players/idle");
  try {
    await set(idlePlayersRef, idlePlayers);
    console.log("Idle players updated successfully");
  } catch (error) {
    console.error("Error updating idle players:", error);
    throw error;
  }
}

export function listenToActivePlayers(
  callback: (activePlayers: number[]) => void
) {
  if (!db) {
    throw new Error(
      "Firebase has not been initialized. Call initializeFirebase() first."
    );
  }
  const activePlayersRef = ref(db, "players/active");

  onValue(activePlayersRef, (snapshot) => {
    const data = snapshot.val();
    if (Array.isArray(data)) {
      callback(data);
    } else {
      callback([]);
    }
  });

  // Return a function to unsubscribe
  return () => off(activePlayersRef);
}

export async function updateActivePlayers(activePlayers: number[]): Promise<void> {
  if (!db) {
    throw new Error(
      "Firebase has not been initialized. Call initializeFirebase() first."
    );
  }
  const activePlayersRef = ref(db, "players/active");
  try {
    await set(activePlayersRef, activePlayers);
    console.log("Active players updated successfully");
  } catch (error) {
    console.error("Error updating active players:", error);
    throw error;
  }
}
