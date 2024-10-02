import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import {
  initializeFirebase,
  listenToIndex,
  getVideoUrl,
  checkVideoExists,
} from "../../lib/firebase";

export default function PlayerPage() {
  const router = useRouter();
  const { id } = router.query;
  const [index, setIndex] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoEnded, setVideoEnded] = useState(false);

  const pageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleFullscreen = () => {
    if (!pageRef.current) return;

    if (!document.fullscreenElement) {
      pageRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "f" || event.key === "F") {
        toggleFullscreen();
      }
    };

    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  useEffect(() => {
    setVideoEnded(false);
    if (videoRef.current) {
      const videoElement = videoRef.current;
      videoElement.volume = 0.05;

      const handleVideoEnded = () => {
        setVideoEnded(true);
        setVideoUrl(null);
      };

      videoElement.addEventListener("ended", handleVideoEnded);

      videoElement.play().catch((error) => {
        console.log("Autoplay was prevented:", error);
        // You might want to show a play button or inform the user here
      });

      return () => {
        videoElement.removeEventListener("ended", handleVideoEnded);
      };
    }
  }, [id, videoUrl]);

  useEffect(() => {
    initializeFirebase();

    if (id === "0" || id === "1") {
      const unsubscribe = listenToIndex(async (timestamp, newIndex) => {
        // if (newIndex % 2 !== parseInt(id)) {
        if (false) {
          return;
        } else {
          setIndex(newIndex);
          try {
            console.log("Fetching video URL for index:", newIndex, "at timestamp:", timestamp);
            const videoExists = await checkVideoExists(newIndex);
            if (videoExists) {
              const url = await getVideoUrl(newIndex);
              setVideoUrl(url);
            } else {
              console.log(`No videos for index ${newIndex}`);
              setVideoUrl(null);
            }
          } catch (error) {
            console.error("Error fetching video URL:", error);
          }
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [id]);

  if (!id || (id !== "0" && id !== "1")) {
    return <div>Invalid player ID. Must be 0 or 1.</div>;
  }

  return (
    <div
      ref={pageRef}
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "black",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "24px",
        color: "black",
      }}
    >
      {index !== null && <div className="text-white">Index: {index}</div>}
      {videoUrl && !videoEnded && (
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          playsInline
          style={{ minHeight: "100%" }}
        >
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
}
