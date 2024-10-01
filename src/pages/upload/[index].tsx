import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { initializeFirebase, uploadVideo } from "@/lib/firebase";

export default function Upload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();
  const { index } = router.query;

  useEffect(() => {
    initializeFirebase();
  }, []);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !index) return;

    setUploading(true);
    try {
      await uploadVideo(
        parseInt(index as string),
        file,
        (progress) => setProgress(progress),
        () => {
          setUploading(false);
        }
      );
    } catch (error) {
      console.error("Error uploading video:", error);
      setUploading(false);
      alert("Upload failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <label className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer">
          {uploading ? "Uploading..." : "Upload Video"}
          <input
            type="file"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
            accept="video/*"
          />
        </label>
        {uploading && (
          <div className="mt-4 text-white">
            Upload progress: {progress.toFixed(2)}%
          </div>
        )}
      </div>
    </div>
  );
}
