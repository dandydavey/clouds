import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  initializeFirebase,
  uploadVideo,
  listenToCloudToVideo,
  updateCloudToVideoMapping,
  checkVideoExists,
} from "@/lib/firebase";

export default function Upload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cloudToVideoMapping, setCloudToVideoMapping] = useState<
    Record<number, string>
  >({});
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const router = useRouter();
  const { index } = router.query;

  useEffect(() => {
    initializeFirebase();

    const unsubscribe = listenToCloudToVideo((mapping) => {
      console.log("New mapping: ", mapping);
      setCloudToVideoMapping(mapping);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !index) return;

    setUploadSuccess(false); // Reset success state
    // Check video duration
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = URL.createObjectURL(file);

    video.onloadedmetadata = async () => {
      URL.revokeObjectURL(video.src);
      if (video.duration > 60) {
        alert("Video must be 60 seconds or less.");
        return;
      }

      setUploading(true);
      try {
        const videoExists = await checkVideoExists(file.name);
        if (videoExists) {
          console.log("Video already exists. Updating mapping only.");
          await updateMapping(file.name);
        } else {
          await uploadVideo(
            file,
            (progress) => setProgress(progress),
            async () => {
              await updateMapping(file.name);
            }
          );
        }
        setUploadSuccess(true); // Set success state to true
      } catch (error) {
        console.error("Error handling video:", error);
        alert("Operation failed. Please try again.");
      } finally {
        setUploading(false);
      }
    };
  };

  const updateMapping = async (fileName: string) => {
    const newMapping = {
      ...cloudToVideoMapping,
      [Number(index)]: fileName,
    };
    await updateCloudToVideoMapping(newMapping);
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
        {uploadSuccess && (
          <div className="mt-4 text-green-500 font-bold">
            Video uploaded successfully!
          </div>
        )}
      </div>
    </div>
  );
}
