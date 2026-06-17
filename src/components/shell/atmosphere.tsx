import type { CSSProperties } from "react";

// Atmósfera del shell (R2a, docs/06 §Ornamentos): niebla en los
// pseudo-elementos de .atmosphere + 10 motas doradas flotantes.
// Posiciones deterministas (sin Math.random: SSR estable); todo el
// movimiento vive en CSS bajo motion-safe y las motas desaparecen con
// prefers-reduced-motion. Solo decorativo: aria-hidden y z-index -1.
const MOTAS: Array<{ left: string; top: string; size: number; dur: number; delay: number }> = [
  { left: "6%", top: "18%", size: 4, dur: 17, delay: 0 },
  { left: "14%", top: "64%", size: 3, dur: 23, delay: -4 },
  { left: "24%", top: "32%", size: 5, dur: 19, delay: -9 },
  { left: "37%", top: "78%", size: 3, dur: 26, delay: -2 },
  { left: "48%", top: "12%", size: 4, dur: 21, delay: -12 },
  { left: "58%", top: "52%", size: 3, dur: 16, delay: -6 },
  { left: "67%", top: "84%", size: 4, dur: 24, delay: -15 },
  { left: "76%", top: "28%", size: 5, dur: 20, delay: -3 },
  { left: "86%", top: "66%", size: 3, dur: 25, delay: -10 },
  { left: "93%", top: "40%", size: 4, dur: 18, delay: -7 },
];

export function Atmosphere() {
  return (
    <div aria-hidden className="atmosphere">
      {MOTAS.map((mota, index) => (
        <span
          key={index}
          className="mota"
          style={
            {
              left: mota.left,
              top: mota.top,
              width: `${mota.size}px`,
              height: `${mota.size}px`,
              "--mota-dur": `${mota.dur}s`,
              animationDelay: `${mota.delay}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
