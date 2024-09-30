import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { initializeFirebase, listenToScreenIndex } from "../../lib/firebase";

export default function PlayerPage() {
  const router = useRouter();
  const { id } = router.query;
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    initializeFirebase();

    if (id === "0" || id === "1") {
      const unsubscribe = listenToScreenIndex(parseInt(id), (newIndex) => {
        setIndex(newIndex);
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
        backgroundColor: index === null ? "black" : "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "48px",
        color: "black",
      }}
    >
      {index !== null && <div>Index: {index}</div>}
    </div>
  );
}
