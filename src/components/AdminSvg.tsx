import React, { useState, useEffect, useCallback } from "react";
import {
  updateIndex,
  listenToCloudToVideo,
  updateCloudToVideoMapping,
  checkVideoExists,
  uploadVideo,
} from "../lib/firebase";

interface AdminAreasProps {
  setClickedIndices: React.Dispatch<React.SetStateAction<boolean[]>>;
  paths: string[];
  setHoveredIndex: React.Dispatch<React.SetStateAction<number | null>>;
  numPlayers: number;
}

export default function AdminAreas({
  setClickedIndices,
  paths,
  setHoveredIndex,
  numPlayers,
}: AdminAreasProps) {
  const [showTooltips, setShowTooltips] = useState(true);
  const [cloudToVideo, setCloudToVideo] = useState<Record<number, string>>({});
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    const unsubscribeCloud = listenToCloudToVideo((mapping) => {
      setCloudToVideo(mapping);
    });

    return () => {
      unsubscribeCloud();
    };
  }, [numPlayers]);

  const handleClick = useCallback(
    async (index: number) => {
      console.log("clicked ", index);
      setClickedIndices((prev) => {
        const newClickedPaths = [...prev];
        newClickedPaths[index] = !newClickedPaths[index];
        if (newClickedPaths[index]) {
          setTimeout(() => {
            setClickedIndices((current) => {
              const updatedPaths = [...current];
              updatedPaths[index] = false;
              return updatedPaths;
            });
          }, 5000);
        }
        return newClickedPaths;
      });

      updateIndex(index)
        .then(() => console.log("Click event sent to db successfully"))
        .catch((error) => console.error("Error sending click to db:", error));

      // Open file picker
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "video/*";
      input.onchange = (event: Event) => handleUpload(event, index);
      input.click();
    },
    [setClickedIndices, cloudToVideo]
  );

  const handleUpload = async (event: Event, index: number) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    setUploadSuccess(false);
    setUploading(true);
    setProgress(0);

    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = URL.createObjectURL(file);

    video.onloadedmetadata = async () => {
      URL.revokeObjectURL(video.src);
      if (video.duration > 30) {
        alert("Video must be 30 seconds or less.");
        setUploading(false);
        return;
      }

      try {
        const videoExists = await checkVideoExists(file.name);
        if (videoExists) {
          console.log("Video already exists. Updating mapping only.");
          await updateMapping(file.name, index);
        } else {
          await uploadVideo(
            file,
            (progress) => setProgress(progress),
            async () => {
              await updateMapping(file.name, index);
            }
          );
        }
        setUploadSuccess(true);
      } catch (error) {
        console.error("Error handling video:", error);
        alert("Operation failed. Please try again.");
      } finally {
        setUploading(false);
      }
    };
  };

  const updateMapping = async (fileName: string, index: number) => {
    const newMapping = {
      ...cloudToVideo,
      [index]: fileName,
    };
    await updateCloudToVideoMapping(newMapping);
  };

  const handleHover = (index: number | null) => {
    setHoveredIndex(index);
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "t" || event.key === "T") {
        setShowTooltips((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  return (
    <>
      <svg
        className={`absolute`}
        style={{ top: 0, left: 0, width: "100%", height: "100%" }}
        viewBox="0 0 2560 1423"
      >
        <defs>
          {paths.map((path, index) => (
            <clipPath key={`clip-${index}`} id={`clip-path-${index}`}>
              <path d={path} />
            </clipPath>
          ))}
        </defs>
        {paths.map((_, index) => (
          <g key={`group-${index}`}>
            <rect
              width="100%"
              height="100%"
              opacity={0}
              onClick={() => handleClick(index)}
              onMouseEnter={() => handleHover(index)}
              onMouseLeave={() => handleHover(null)}
              clipPath={`url(#clip-path-${index})`}
            />
            {showTooltips && <title>Cloud {index}</title>}
          </g>
        ))}
      </svg>
      {uploading && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded">
            <p>Uploading: {progress.toFixed(2)}%</p>
          </div>
        </div>
      )}
      {uploadSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white p-2 rounded">
          Upload successful!
        </div>
      )}
    </>
  );
}
