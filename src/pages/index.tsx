import { useState, useRef } from 'react';

function Box({ audioFile, currentAudio, setCurrentAudio }: { audioFile: string, currentAudio: HTMLAudioElement | null, setCurrentAudio: (audio: HTMLAudioElement | null) => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = () => {
    if (currentAudio && currentAudio !== audioRef.current) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    if (!isPlaying) {
      const audio = new Audio(audioFile);
      audioRef.current = audio;
      setCurrentAudio(audio);
      setIsPlaying(true);
      audio.play();
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentAudio(null);
      };
    }
  };

  return (
    <>
      <div
        className={`w-10 h-10 border-2 bg-pink-600 ${isPlaying ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={playAudio}
      ></div>
    </>
  );
}

export default function Home() {
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

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
        <div
          className="absolute"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <Box audioFile="/Test.m4a" currentAudio={currentAudio} setCurrentAudio={setCurrentAudio} />
          <Box audioFile="/Test2.m4a" currentAudio={currentAudio} setCurrentAudio={setCurrentAudio} />
        </div>
      </main>
    </>
  );
}
