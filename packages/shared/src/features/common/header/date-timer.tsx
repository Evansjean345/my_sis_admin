// components/DateTimer.tsx
"use client";

import { useEffect, useState } from "react";

export default function DateTimer() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Évite l'erreur d'hydratation (le serveur et le client n'ont pas la même heure)
  if (!now) return null;

  const date = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const time = now.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="text-[#0E508D] text-center md:block hidden">
      <p className="text-[12px] capitalize">{date}</p>
      <p className="text-[12px] font-bold tabular-nums">{time}</p>
    </div>
  );
}
