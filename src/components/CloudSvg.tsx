import React from "react";

interface CloudSvgProps {
  clicked: boolean;
  onClick: () => void;
  paths: string[];
}

export default function CloudSvg({ clicked, onClick, paths }: CloudSvgProps) {
  return (
    <>
      {paths.map((path, index) => (
        <svg
          key={index}
          className={`absolute ${clicked ? "clicked" : ""}`}
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
            fill="transparent"
            onClick={onClick}
            clipPath={`url(#clip-path-${index})`}
          />
        </svg>
      ))}
    </>
  );
}
