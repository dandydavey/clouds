import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import {
  initializeFirebase,
  listenToIndex,
  getVideoUrl,
  listenToCloudToVideo,
  getRandomVideoUrl,
} from "../../lib/firebase";

export default function PlayerPage() {
  const router = useRouter();
  const { id } = router.query;
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [cloudToVideoMapping, setCloudToVideoMapping] = useState<
    Record<number, string>
  >({});

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

    const unsubscribeCloudToVideo = listenToCloudToVideo((mapping) => {
      setCloudToVideoMapping(mapping);
    });

    return () => {
      unsubscribeCloudToVideo();
    };
  }, []);

  useEffect(() => {
    setVideoEnded(false);
    if (videoRef.current) {
      const videoElement = videoRef.current;
      // videoElement.volume = 0.05;

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
    if (id === "0" || id === "1") {
      const unsubscribe = listenToIndex(async (timestamp, newIndex) => {
        try {
          console.log(
            "Fetching video URL for index:",
            newIndex,
            "at timestamp:",
            timestamp
          );
          const filename = cloudToVideoMapping[newIndex];
          if (filename) {
            const url = await getVideoUrl(filename);
            setVideoUrl(url);
          } else {
            const randomUrl = await getRandomVideoUrl();
            console.log(
              `No videos for index ${newIndex}, fetched random video: ${randomUrl}`
            );
            setVideoUrl(randomUrl);
          }
        } catch (error) {
          console.error("Error fetching video URL:", error);
          const randomUrl = await getRandomVideoUrl();
          console.log(
            `No videos for index ${newIndex}, fetched random video: ${randomUrl}`
          );
          setVideoUrl(randomUrl);
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [id, cloudToVideoMapping]);

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
      {/* {index !== null && <div className="text-white">Index: {index}</div>} */}
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
