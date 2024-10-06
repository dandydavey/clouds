import React, { useState, useEffect, useCallback } from "react";
import {
  updateIndex,
  sendToPlayer,
  listenToCloudToVideo,
  getRandomVideoFilename,
} from "../lib/firebase";

interface CloudSvgProps {
  clickedIndices: boolean[];
  setClickedIndices: React.Dispatch<React.SetStateAction<boolean[]>>;
  hoveredIndex: number | null;
  setHoveredIndex: React.Dispatch<React.SetStateAction<number | null>>;
  paths: string[];
  numPlayers: number;
}

export function EffectAreas({
  clickedIndices,
  hoveredIndex,
  paths,
}: CloudSvgProps) {
  return (
    <>
      {paths.map((path, index) => (
        <svg
          key={index}
          className={`absolute ${
            clickedIndices[index]
              ? "clicked"
              : hoveredIndex === index
              ? "hovered"
              : ""
          }`}
          style={{ top: 0, left: 0, width: "100%", height: "100%" }}
          viewBox="0 0 2560 1423"
        >
          <defs>
            <clipPath id={`clip-path-${index}`}>
              <path d={path} />
            </clipPath>
          </defs>
          <image
            href="/sky_above_clouds_iv.png"
            width="2560"
            height="1423"
            clipPath={`url(#clip-path-${index})`}
          />
          <rect
            width="100%"
            height="100%"
            // fill="red"
            opacity={0}
            clipPath={`url(#clip-path-${index})`}
          />
        </svg>
      ))}
    </>
  );
}

export default function ClickAreas({
  setClickedIndices,
  paths,
  setHoveredIndex,
  numPlayers,
}: CloudSvgProps) {
  const [showTooltips, setShowTooltips] = useState(true);
  const [cloudToVideo, setCloudToVideo] = useState<Record<number, string>>({});

  useEffect(() => {
    const unsubscribe = listenToCloudToVideo((mapping) => {
      setCloudToVideo(mapping);
    });

    return () => unsubscribe();
  }, []);

  const handleClick = useCallback(
    async (index: number) => {
      console.log("clicked ", index);
      setClickedIndices((prev) => {
        const newClickedPaths = [...prev];
        newClickedPaths[index] = !newClickedPaths[index];

        // Set a timer to remove the clicked state after 5 seconds
        if (newClickedPaths[index]) {
          setTimeout(() => {
            setClickedIndices((current) => {
              const updatedPaths = [...current];
              console.log("removed click state from  ", index);
              updatedPaths[index] = false;
              return updatedPaths;
            });
          }, 5000);
        }

        return newClickedPaths;
      });

      // Send click event to db.
      updateIndex(index)
        .then(() => console.log("Click event sent to db successfully"))
        .catch((error) => console.error("Error sending click to db:", error));

      // Send to player
      let filename = cloudToVideo[index];
      if (!filename) {
        try {
          filename = await getRandomVideoFilename();
        } catch (error) {
          console.error("Error getting random video filename:", error);
          return;
        }
      }

      if (filename) {
        const randomPlayerIndex = Math.floor(Math.random() * numPlayers);
        sendToPlayer(filename, randomPlayerIndex)
          .then(() => console.log(`Sent to player ${randomPlayerIndex} successfully`))
          .catch((error) => console.error("Error sending to player:", error));
      }
    },
    [setClickedIndices, cloudToVideo, numPlayers]
  );

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
  );
}
