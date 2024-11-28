import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  updateIndex,
  sendToPlayer,
  listenToCloudToVideo,
  getRandomVideo,
  listenToIdlePlayers,
  listenToActivePlayers,
  updateIdlePlayers,
  updateActivePlayers,
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
  const idlePlayersRef = useRef<number[]>([]);
  const activePlayersRef = useRef<number[]>([]);

  useEffect(() => {
    updateIdlePlayers(Array.from({ length: numPlayers }, (_, i) => i));
    updateActivePlayers([]);

    const unsubscribeCloud = listenToCloudToVideo((mapping) => {
      setCloudToVideo(mapping);
    });

    const unsubscribeIdle = listenToIdlePlayers((players) => {
      idlePlayersRef.current = players;
      console.log("idle players: ", idlePlayersRef.current);
    });

    const unsubscribeActive = listenToActivePlayers((players) => {
      activePlayersRef.current = players;
    });

    return () => {
      unsubscribeCloud();
      unsubscribeIdle();
      unsubscribeActive();
    };
  }, [numPlayers]);

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
          filename = await getRandomVideo();
        } catch (error) {
          console.error("Error getting random video filename:", error);
          return;
        }
      }

      if (filename) {
        let targetPlayer: number | undefined;

        console.log("idle players with filename: ", idlePlayersRef.current);
        if (idlePlayersRef.current.length > 0) {
          console.log("has an idle player: ", idlePlayersRef.current[0]);
          targetPlayer = idlePlayersRef.current[0];
        } else if (activePlayersRef.current.length > 0) {
          console.log("has an active player: ", activePlayersRef.current[0]);
          targetPlayer = activePlayersRef.current[0];
        }
        if (targetPlayer !== undefined) {
          sendToPlayer(filename, targetPlayer)
            .then(() =>
              console.log(`Sent to player ${targetPlayer} successfully`)
            )
            .catch((error) => console.error("Error sending to player:", error));
        } else {
          console.warn("No available players to send the video to.");
        }
      }
    },
    [setClickedIndices, cloudToVideo]
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
