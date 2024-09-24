import React from "react";

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
            clickedIndices[index] ? "clicked" : hoveredIndex === index ? "hovered" : ""
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
  const handleClick = (index: number) => {
    console.log("clicked ", index);
    setClickedIndices((prev) => {
      const newClickedPaths = [...prev];
      newClickedPaths[index] = !newClickedPaths[index];
      return newClickedPaths;
    });
  };

  const handleHover = (index: number | null) => {
    console.log("hovered ", index);
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
