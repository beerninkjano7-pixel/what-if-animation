import React from 'react';
import { rnd } from '../anim';
import { NightSky, Stars, Moon, Skyline } from '../kit';
import { Glow, LightVeil } from '../light';

// A street at 3 a.m., seen down its length: the road runs to a vanishing point at (960, 560), pavements and
// houses either side, street lamps in pools of orange light, the moon over the far rooftops. Everything is still;
// `cars` (0..1) streams headlights down the road instead (the "world that never stops" shot).
export const STREET = { vp: { x: 960, y: 560 }, road: 1080 };
/** A point on the road: across (-1 left kerb .. 1 right kerb), depth d (0 far .. 1 near camera). */
export const roadP = (across: number, d: number) => {
  const k = 0.06 + 0.94 * d * d;
  return { x: STREET.vp.x + across * 900 * k, y: STREET.vp.y + (1080 - STREET.vp.y + 140) * k, k };
};

export const NightStreet: React.FC<{ t: number; id?: string; cars?: number; red?: number }> = ({ t, id = 'st', cars = 0, red = 0 }) => {
  const lamps = [0.25, 0.45, 0.7, 1.0];
  return (
    <g>
      <NightSky id={`${id}sky`} horizonY={560} />
      <Stars seed={7} x0={0} y0={0} w={1920} h={420} t={t} n={50} />
      <Moon x={1320} y={240} r={60} />
      <Skyline y={560} seed={4} color="#1A1F3A" h={140} />
      {/* the road and the pavements */}
      {(() => {
        const a = roadP(-1, 0), b = roadP(1, 0), c = roadP(1, 1.15), d = roadP(-1, 1.15);
        const pa = roadP(-1.5, 0), pb = roadP(-1.5, 1.15), qa = roadP(1.5, 0), qb = roadP(1.5, 1.15);
        return (
          <g>
            <polygon points={`${pa.x},${pa.y} ${a.x},${a.y} ${d.x},${d.y} ${pb.x},${pb.y}`} fill="#2C2838" />
            <polygon points={`${b.x},${b.y} ${qa.x},${qa.y} ${qb.x},${qb.y} ${c.x},${c.y}`} fill="#2C2838" />
            <polygon points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`} fill="#1E1C28" />
            {Array.from({ length: 9 }).map((_, i) => {
              const d0 = i / 9, d1 = d0 + 0.05;
              const p = roadP(0, d0), q = roadP(0, d1);
              return <path key={i} d={`M ${p.x} ${p.y} L ${q.x} ${q.y}`} stroke="#B8B4A8" strokeWidth={2 + 14 * q.k} opacity={0.6} />;
            })}
          </g>
        );
      })()}
      {/* houses either side, a few windows still lit */}
      {[-1, 1].map((side) =>
        Array.from({ length: 6 }).map((_, i) => {
          const d0 = i / 6, d1 = (i + 0.9) / 6;
          const f = roadP(side * 1.6, d0), n = roadP(side * 1.6, d1);
          const hf = 300 * f.k + 60, hn = 300 * n.k + 60;
          const lit = rnd(i + 3, side + 5) > 0.7;
          return (
            <g key={`${side}${i}`}>
              <polygon points={`${f.x},${f.y} ${n.x},${n.y} ${n.x},${n.y - hn} ${f.x},${f.y - hf}`} fill={i % 2 ? '#262640' : '#2C2A48'} />
              <polygon points={`${(f.x * 2 + n.x) / 3},${(f.y * 2 + n.y) / 3 - hf * 0.62} ${(f.x + n.x * 2) / 3},${(f.y + n.y * 2) / 3 - hn * 0.62} ${(f.x + n.x * 2) / 3},${(f.y + n.y * 2) / 3 - hn * 0.4} ${(f.x * 2 + n.x) / 3},${(f.y * 2 + n.y) / 3 - hf * 0.4}`} fill={lit ? '#FFC67A' : '#1A1830'} opacity={lit ? 0.85 : 1} />
            </g>
          );
        }),
      )}
      {/* street lamps and their pools of light */}
      {lamps.map((d, i) =>
        [-1.2, 1.2].map((side) => {
          const b = roadP(side, d);
          const h = 420 * b.k + 30;
          return (
            <g key={`l${i}${side}`}>
              <path d={`M ${b.x} ${b.y} L ${b.x} ${b.y - h} L ${b.x - side * 40 * b.k} ${b.y - h}`} stroke="#14121C" strokeWidth={3 + 10 * b.k} fill="none" />
              <ellipse cx={b.x - side * 120 * b.k} cy={b.y + 10 * b.k} rx={260 * b.k + 20} ry={60 * b.k + 6} fill="#FFB060" opacity={0.18} style={{ mixBlendMode: 'screen' }} />
              <Glow x={b.x - side * 40 * b.k} y={b.y - h + 10 * b.k} r={140 * b.k + 30} o={0.7} />
            </g>
          );
        }),
      )}
      {cars > 0
        ? Array.from({ length: 14 }).map((_, i) => {
            const d = ((t / 40 + i / 14) % 1) ** 2;
            const p = roadP(i % 2 ? 0.45 : -0.45, d);
            const col = i % 2 ? '#FF4A3A' : '#FFF3D0';
            return <ellipse key={`c${i}`} cx={p.x} cy={p.y - 20 * p.k} rx={(10 + 120 * p.k) * 1.6} ry={6 + 30 * p.k} fill={col} opacity={cars * 0.8} style={{ filter: `blur(${2 + 8 * p.k}px)`, mixBlendMode: 'screen' }} />;
          })
        : null}
      <LightVeil id={`${id}veil`} lights={lamps.map((d) => { const b = roadP(0, d); return [b.x, b.y - 80 * b.k, 300 * b.k + 60] as [number, number, number]; })} o={0.35} />
      {red > 0 ? <rect x={-400} y={-400} width={2720} height={1880} fill="#B0202E" opacity={0.3 * red} style={{ mixBlendMode: 'multiply' }} /> : null}
    </g>
  );
};
