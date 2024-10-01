import React from "react";
import { updateIndex } from "../lib/firebase";
import { useCallback } from "react";

interface CloudSvgProps {
  clickedIndices: boolean[];
  setClickedIndices: React.Dispatch<React.SetStateAction<boolean[]>>;
  hoveredIndex: number | null;
  setHoveredIndex: React.Dispatch<React.SetStateAction<number | null>>;
  paths: string[];
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
}: CloudSvgProps) {
  const handleClick = useCallback(
    (index: number) => {
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
    },
    [setClickedIndices]
  );

  const handleHover = (index: number | null) => {
    setHoveredIndex(index);
  };

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
        <rect
          key={`rect-${index}`}
          width="100%"
          height="100%"
          opacity={0}
          onClick={() => handleClick(index)}
          onMouseEnter={() => handleHover(index)}
          onMouseLeave={() => handleHover(null)}
          clipPath={`url(#clip-path-${index})`}
        />
      ))}
    </svg>
  );
}
