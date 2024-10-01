import { useRouter } from "next/router";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    initializeFirebase();

    if (id === "0" || id === "1") {
      const unsubscribe = listenToIndex(async (newIndex) => {
        if (newIndex % 2 !== parseInt(id)) {
          return;
        } else {
          setIndex(newIndex);
          try {
            console.log("Fetching video URL for index:", newIndex);
            const videoExists = await checkVideoExists(
              `videos/${newIndex}.mov`
            );
            if (videoExists) {
              const url = await getVideoUrl(`videos/${newIndex}.mov`);
              setVideoUrl(url);
            } else {
              console.log(`Video ${newIndex}.mov does not exist`);
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
      {videoUrl && (
        <video src={videoUrl} controls autoPlay style={{ minHeight: "100%" }}>
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
}
