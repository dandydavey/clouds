import { GetServerSideProps } from "next";
import Image from "next/image";
import ClickOutlines from "@/components/CloudSvg";
import { EffectAreas } from "@/components/CloudSvg";
import { useState, useEffect, useRef } from "react";
import fs from "fs";
import path from "path";
import { parseString } from "xml2js";
import { promisify } from "util";

const parseStringPromise = promisify(parseString);

interface CloudsProps {
  paths: string[];
}

interface SvgResult {
  svg?: {
    path?: Array<{
      $?: {
        d?: string;
      };
    }>;
  };
}

export default function Clouds({ paths }: CloudsProps) {
  const [clickedIndices, setClickedIndices] = useState<boolean[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [numPlayers, setNumPlayers] = useState<number>(1);
  const pageRef = useRef<HTMLDivElement>(null);

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
      } else if (event.key === "1" || event.key === "2" || event.key === "3") {
        console.log("Setting numPlayers to ", event.key);
        setNumPlayers(parseInt(event.key));
      }
    };

    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  return (
    <div
      ref={pageRef}
      style={{
        margin: 0,
        padding: 0,
        position: "relative",
        width: "2560px",
        height: "1423px",
      }}
    >
      {/* Flexbox under image */}
      <Image
        src="/sky_above_clouds_iv.png"
        alt="Sky Above The Clouds IV by Georgia O'Keefe"
        width={2560}
        height={1423}
        layout="intrinsic"
        className={`absolute`}
        style={{ top: 0, left: 0 }}
      />
      <EffectAreas
        clickedIndices={clickedIndices}
        setClickedIndices={setClickedIndices}
        hoveredIndex={hoveredIndex}
        setHoveredIndex={setHoveredIndex}
        paths={paths}
        numPlayers={numPlayers}
      />
      <ClickOutlines
        clickedIndices={clickedIndices}
        setClickedIndices={setClickedIndices}
        hoveredIndex={hoveredIndex}
        setHoveredIndex={setHoveredIndex}
        paths={paths}
        numPlayers={numPlayers}
      />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<CloudsProps> = async () => {
  const svgFilePath = path.join(process.cwd(), "public", "clouds.svg");
  const svgContent = fs.readFileSync(svgFilePath, "utf-8");

  const result = await parseStringPromise(svgContent);
  const paths: string[] = [];

  const svgResult = result as SvgResult;

  if (svgResult.svg && Array.isArray(svgResult.svg.path)) {
    svgResult.svg.path.forEach((pathElement) => {
      if (pathElement.$ && pathElement.$.d) {
        paths.push(pathElement.$.d);
      }
    });
  }
  console.log("There are", paths.length, "paths");

  return {
    props: {
      paths,
    },
  };
};
