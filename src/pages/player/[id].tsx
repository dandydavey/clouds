import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import {
  initializeFirebase,
  listenToPlayer,
  getVideoUrl,
} from "../../lib/firebase";

export default function PlayerPage() {
  const router = useRouter();
  const { id } = router.query;
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
    initializeFirebase();

    if (typeof id === "string") {
      const playerIndex = parseInt(id);
      if (isNaN(playerIndex)) {
        console.error("Invalid player ID");
        return;
      }

      const unsubscribe = listenToPlayer(playerIndex, async (filename) => {
        if (filename) {
          try {
            const url = await getVideoUrl(filename);
            setVideoUrl(url);
            setVideoEnded(false);
          } catch (error) {
            console.error("Error fetching video URL:", error);
          }
        } else {
          setVideoUrl(null);
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [id]);

  useEffect(() => {
    setVideoEnded(false);
    if (videoRef.current && videoUrl) {
      const videoElement = videoRef.current;

      const handleVideoEnded = () => {
        setVideoEnded(true);
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
  }, [videoUrl]);

  if (!id || (typeof id === "string" && !["0", "1", "2"].includes(id))) {
    return <div>Invalid player ID. Must be 0, 1, or 2.</div>;
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
      {videoUrl && !videoEnded && (
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          muted={true}
          playsInline
          style={{ minHeight: "100%" }}
        >
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
}
