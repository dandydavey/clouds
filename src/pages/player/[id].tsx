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
  const [isFullscreen, setIsFullscreen] = useState(false);
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
    setVideoEnded(false);
    if (videoRef.current) {
      const videoElement = videoRef.current;
      videoElement.volume = 0.2;

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
      const unsubscribe = listenToIndex(async (newIndex) => {
        // if (newIndex % 2 !== parseInt(id)) {
        if (false) {
          return;
        } else {
          setIndex(newIndex);
          try {
            console.log("Fetching video URL for index:", newIndex);
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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

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
      {videoEnded && <div className="text-white">Video has ended</div>}
      <button
        onClick={toggleFullscreen}
        className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-slate-900"
      >
        {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      </button>
    </div>
  );
}
