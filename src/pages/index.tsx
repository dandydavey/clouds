import { useState } from "react";
import Image from "next/image";
import Overlay from "@/components/Overlay";

function Box({ audioFile }: { audioFile: string }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudio = () => {
    if (!isPlaying) {
      const audio = new Audio(audioFile);
      setIsPlaying(true);
      audio.play();
      audio.onended = () => {
        setIsPlaying(false);
      };
    }
  };

  return (
    <>
      <div
        className={`w-10 h-10 border-2 bg-pink-600 ${
          isPlaying ? "cursor-not-allowed" : "cursor-pointer"
        }`}
        onClick={playAudio}
      ></div>
    </>
  );
}

export default function Home() {
  return (
    <>
      <main
        className={`h-full relative`}
        style={{
          backgroundImage: 'url("/sky_above_clouds_iv.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Overlay></Overlay>
        <div
          className="absolute"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <Box audioFile="/Test.m4a" />
          <Box audioFile="/Test2.m4a" />
        </div>
      </main>
    </>
  );
}
