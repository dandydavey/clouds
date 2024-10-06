import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { initializeFirebase, listenToIndex } from "../lib/firebase";

export default function QRUploadPage() {
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    initializeFirebase();

    const unsubscribe = listenToIndex((timestamp, newIndex) => {
      setIndex(newIndex);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const uploadUrl =
    index !== null ? `${window.location.origin}/upload/${index}` : "";

  return (
    <div className="w-screen h-screen bg-black flex flex-col justify-center items-center text-white">
      <h1 className="font-georgia text-2xl mb-8 text-center">
        Leave a memory for the next viewer to discover ❤ ️
      </h1>
      {index !== null && (
        <QRCodeSVG
          value={uploadUrl}
          size={256}
          bgColor="#ffffff"
          fgColor="#000000"
          level="H"
          className="mb-8"
        />
      )}
      <h1 className="font-georgia text-2xl mb-8 text-center text-black"> {uploadUrl}</h1>
    </div>
  );
}
