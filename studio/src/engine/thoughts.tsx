import React from 'react';
import { clamp, backOut, easeOut } from './anim';
import { SCH } from './sets/schematic';

// Pieces for mind powers (hearing thoughts, reading minds): a thought bubble that floats up from a head, waves that
// pulse out from the listener, small doodles for what a crowd is thinking, and a few props the first episode
// needed (a potted cactus, a padlock, a schematic head). A thought is a picture inside the bubble, never a sentence:
// the genre keeps words off the picture.

export const THINK = { fill: '#F6EFE3', line: '#1A1230', glow: '#9FE3FF', dark: '#2A2236', darkLine: '#0B0816', red: '#FF4A5A' };

/**
 * A thought bubble floating above a head. Before t = 0 nothing; then three trail dots pop up from `from` (the top of
 * the thinker's head) toward the bubble, and the bubble pops on at (x, y) with an overshoot at t = 5, then bobs.
 * `r` is its half height (it is about 1.35 r wide each side). Children draw centred on (x, y) at full size and scale
 * with the pop. `dark` is a secret: a dark bubble with a red glow.
 */
export const ThoughtBubble: React.FC<{ x: number; y: number; from: { x: number; y: number }; t: number; r?: number; dark?: boolean; children?: React.ReactNode; seed?: number }> = ({
  x, y, from, t, r = 120, dark = false, children, seed = 0,
}) => {
  if (t < 0) return null;
  const fill = dark ? THINK.dark : THINK.fill;
  const line = dark ? THINK.darkLine : THINK.line;
  const glow = dark ? THINK.red : THINK.glow;
  const bob = Math.sin((t + seed * 7) / 9) * r * 0.035;
  const pop = backOut(clamp((t - 5) / 8));
  const cx = x;
  const cy = y + bob;
  // the trail: three dots from just above the head toward the bubble's lower edge
  const end = { x: cx + (from.x - cx) * 0.18, y: cy + r * 0.95 };
  const dots = [0.28, 0.55, 0.8].map((k, i) => ({
    x: from.x + (end.x - from.x) * k,
    y: from.y + (end.y - from.y) * k,
    rr: r * (0.07 + i * 0.05),
    s: backOut(clamp((t - i * 1.6) / 5)),
  }));
  const n = 10;
  const lobes = Array.from({ length: n }).map((_, i) => {
    const a = (i / n) * Math.PI * 2 + seed;
    return { x: Math.cos(a) * r * 1.12, y: Math.sin(a) * r * 0.74, rr: r * (0.4 + 0.06 * Math.sin(i * 2.3 + seed)) };
  });
  const shape = (stroke: boolean) => (
    <g fill={stroke ? line : fill} stroke={stroke ? line : 'none'} strokeWidth={stroke ? r * 0.1 : 0}>
      <ellipse cx={0} cy={0} rx={r * 1.2} ry={r * 0.82} />
      {lobes.map((l, i) => (
        <circle key={i} cx={l.x} cy={l.y} r={l.rr} />
      ))}
    </g>
  );
  return (
    <g>
      {dots.map((d, i) =>
        d.s > 0 ? <circle key={i} cx={d.x} cy={d.y} r={d.rr * d.s} fill={fill} stroke={line} strokeWidth={r * 0.045} /> : null,
      )}
      {pop > 0 ? (
        <g transform={`translate(${cx} ${cy}) scale(${pop})`} style={{ filter: `drop-shadow(0 0 ${r * 0.18}px ${glow}${dark ? 'AA' : '88'})` }}>
          {shape(true)}
          {shape(false)}
          {/* a soft shade along the bottom, a highlight up top */}
          <ellipse cx={0} cy={r * 0.42} rx={r * 1.15} ry={r * 0.38} fill="#000" opacity={dark ? 0.2 : 0.06} />
          <ellipse cx={-r * 0.5} cy={-r * 0.48} rx={r * 0.4} ry={r * 0.14} fill="#FFFFFF" opacity={dark ? 0.08 : 0.5} />
          <g transform={`translate(${-cx} ${-cy})`}>
            <g transform={`translate(0 ${bob})`}>{children}</g>
          </g>
        </g>
      ) : null}
    </g>
  );
};

/** Sound waves pulsing out to both sides of a head: the power listening. Loops every 18 frames from t = 0. */
export const ListenWaves: React.FC<{ x: number; y: number; t: number; r0?: number; color?: string; o?: number }> = ({ x, y, t, r0 = 80, color = THINK.glow, o = 1 }) => {
  if (t < 0) return null;
  return (
    <g fill="none" stroke={color} strokeLinecap="round">
      {[0, 6, 12].map((d, i) => {
        const k = ((t + d) % 18) / 18;
        const r = r0 * (1 + k * 1.1);
        const op = o * Math.sin(k * Math.PI) * clamp(t / 4);
        return (
          <g key={i} opacity={op} strokeWidth={r0 * 0.09}>
            <path d={`M ${x - r * 0.5} ${y - r * 0.85} A ${r} ${r} 0 0 0 ${x - r * 0.5} ${y + r * 0.85}`} />
            <path d={`M ${x + r * 0.5} ${y - r * 0.85} A ${r} ${r} 0 0 1 ${x + r * 0.5} ${y + r * 0.85}`} />
          </g>
        );
      })}
    </g>
  );
};

/** Small pictures for a crowd's thoughts, centred on (x, y), about 2s wide: heart, note, ball, star, burger, zzz, cat, game. */
export type DoodleKind = 'heart' | 'note' | 'ball' | 'star' | 'burger' | 'zzz' | 'cat' | 'game';
export const Doodle: React.FC<{ x: number; y: number; kind: DoodleKind; s?: number }> = ({ x, y, kind, s = 40 }) => {
  const k = s / 40;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} strokeLinejoin="round" strokeLinecap="round">
      {kind === 'heart' ? <path d="M 0 30 C -50 -4 -30 -40 0 -16 C 30 -40 50 -4 0 30 Z" fill="#E4505E" stroke="#1A1230" strokeWidth={5} /> : null}
      {kind === 'note' ? (
        <g fill="#3E4A8A" stroke="#1A1230" strokeWidth={4}>
          <ellipse cx={-14} cy={22} rx={13} ry={10} />
          <ellipse cx={20} cy={14} rx={13} ry={10} />
          <path d="M -2 22 L -2 -26 L 32 -34 L 32 14" fill="none" strokeWidth={7} stroke="#3E4A8A" />
          <path d="M -2 -26 L 32 -34 L 32 -22 L -2 -14 Z" fill="#3E4A8A" stroke="none" />
        </g>
      ) : null}
      {kind === 'ball' ? (
        <g stroke="#1A1230" strokeWidth={4}>
          <circle r={30} fill="#FFFFFF" />
          <path d="M 0 -12 L 11 -4 L 7 9 L -7 9 L -11 -4 Z" fill="#1A1230" />
          <path d="M 0 -12 L 0 -30 M 11 -4 L 28 -10 M 7 9 L 17 24 M -7 9 L -17 24 M -11 -4 L -28 -10" fill="none" strokeWidth={3} />
        </g>
      ) : null}
      {kind === 'star' ? <path d="M 0 -34 L 10 -10 L 34 -10 L 15 6 L 22 32 L 0 17 L -22 32 L -15 6 L -34 -10 L -10 -10 Z" fill="#FFD65A" stroke="#1A1230" strokeWidth={4} /> : null}
      {kind === 'burger' ? (
        <g stroke="#1A1230" strokeWidth={4}>
          <path d="M -32 -4 Q -32 -32 0 -32 Q 32 -32 32 -4 Z" fill="#E0A050" />
          <rect x={-34} y={-4} width={68} height={8} rx={4} fill="#6AB04A" />
          <rect x={-32} y={4} width={64} height={12} rx={5} fill="#7A3A2A" />
          <path d="M -32 16 L 32 16 Q 32 30 0 30 Q -32 30 -32 16 Z" fill="#E0A050" />
        </g>
      ) : null}
      {kind === 'zzz' ? (
        <g fill="none" stroke="#3E4A8A" strokeWidth={7}>
          <path d="M -30 -2 L -8 -2 L -30 22 L -8 22" />
          <path d="M 2 -26 L 18 -26 L 2 -8 L 18 -8" strokeWidth={5} />
          <path d="M 24 -40 L 34 -40 L 24 -29 L 34 -29" strokeWidth={4} />
        </g>
      ) : null}
      {kind === 'cat' ? (
        <g stroke="#1A1230" strokeWidth={4}>
          <path d="M -28 -6 L -26 -36 L -8 -22 Q 0 -24 8 -22 L 26 -36 L 28 -6 Q 30 28 0 28 Q -30 28 -28 -6 Z" fill="#E9A060" />
          <circle cx={-10} cy={-2} r={4} fill="#1A1230" stroke="none" />
          <circle cx={10} cy={-2} r={4} fill="#1A1230" stroke="none" />
          <path d="M -4 10 L 0 14 L 4 10" fill="none" />
        </g>
      ) : null}
      {kind === 'game' ? (
        <g stroke="#1A1230" strokeWidth={4}>
          <path d="M -34 -14 Q -40 22 -26 24 Q -16 24 -10 10 L 10 10 Q 16 24 26 24 Q 40 22 34 -14 Q 30 -20 0 -20 Q -30 -20 -34 -14 Z" fill="#5A5A7A" />
          <path d="M -22 -6 L -22 6 M -28 0 L -16 0" strokeWidth={5} stroke="#F6EFE3" />
          <circle cx={18} cy={-4} r={4} fill="#E4505E" stroke="none" />
          <circle cx={26} cy={4} r={4} fill="#5BE08A" stroke="none" />
        </g>
      ) : null}
    </g>
  );
};

/** A potted cactus seen from the side, the pot's base at (x, y), about 300 s tall. `bow` ties a ribbon on the pot. */
export const Cactus: React.FC<{ x: number; y: number; s?: number; bow?: boolean; shadow?: number }> = ({ x, y, s = 1, bow = false, shadow = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} strokeLinejoin="round">
    {shadow ? <ellipse cx={8} cy={2} rx={70} ry={12} fill="#000" opacity={0.3 * shadow} /> : null}
    {/* the plant: a column with two arms, ribs, a pink flower */}
    <g stroke="#1A2A1E" strokeWidth={5}>
      <path d="M -54 -150 Q -86 -150 -86 -190 L -86 -226 Q -86 -246 -70 -246 Q -54 -246 -54 -226 L -54 -190 Z" fill="#4E9A5E" />
      <path d="M 50 -126 Q 84 -126 84 -170 L 84 -196 Q 84 -214 68 -214 Q 52 -214 52 -196 L 52 -170 Z" fill="#4E9A5E" />
      <path d="M -34 -96 L -34 -262 Q -34 -296 0 -296 Q 34 -296 34 -262 L 34 -96 Z" fill="#5AAE6A" />
    </g>
    <path d="M 0 -286 L 0 -100 M -16 -280 L -16 -100 M 16 -280 L 16 -100" stroke="#3E8A50" strokeWidth={4} />
    <path d="M 22 -290 L 26 -110" stroke="#FFE7B3" strokeWidth={4} opacity={0.4} />
    {[[-24, -240], [24, -200], [-22, -160], [20, -140], [-70, -214], [70, -184]].map(([sx, sy], i) => (
      <path key={i} d={`M ${sx} ${sy} l ${sx < 0 ? -10 : 10} -6`} stroke="#F6EFE3" strokeWidth={3} strokeLinecap="round" />
    ))}
    <g transform="translate(0 -298)">
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={0} cy={-12} rx={8} ry={14} fill="#F48AB0" stroke="#1A1230" strokeWidth={3} transform={`rotate(${a})`} />
      ))}
      <circle r={7} fill="#FFD65A" stroke="#1A1230" strokeWidth={3} />
    </g>
    {/* the terracotta pot */}
    <path d="M -64 -110 L 64 -110 L 52 0 L -52 0 Z" fill="#C46A42" stroke="#1A1230" strokeWidth={5} />
    <path d="M -72 -126 L 72 -126 L 72 -104 L -72 -104 Z" fill="#D47A50" stroke="#1A1230" strokeWidth={5} />
    <path d="M 30 -104 L 22 0 L 52 0 L 64 -104 Z" fill="#000" opacity={0.15} />
    {bow ? (
      <g stroke="#1A1230" strokeWidth={4}>
        <rect x={-62} y={-72} width={122} height={18} fill="#4AA8D8" />
        <path d="M 0 -64 Q -40 -100 -46 -62 Q -40 -30 0 -64 Z" fill="#5AB8E8" />
        <path d="M 0 -64 Q 40 -100 46 -62 Q 40 -30 0 -64 Z" fill="#5AB8E8" />
        <circle cx={0} cy={-64} r={9} fill="#3A98C8" />
      </g>
    ) : null}
  </g>
);

/** A padlock icon, centred on (x, y), about 2s tall: a secret. */
export const Padlock: React.FC<{ x: number; y: number; s?: number; color?: string; shut?: number }> = ({ x, y, s = 60, color = '#E9C46A', shut = 1 }) => {
  const k = s / 60;
  const lift = (1 - shut) * 44;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} strokeLinejoin="round">
      <path d={`M -26 ${-8 - lift} L -26 ${-34 - lift} Q -26 ${-64 - lift} 0 ${-64 - lift} Q 26 ${-64 - lift} 26 ${-34 - lift} L 26 -8`} fill="none" stroke="#1A1230" strokeWidth={22} strokeLinecap="round" />
      <path d={`M -26 ${-8 - lift} L -26 ${-34 - lift} Q -26 ${-64 - lift} 0 ${-64 - lift} Q 26 ${-64 - lift} 26 ${-34 - lift} L 26 -8`} fill="none" stroke="#B8BCC8" strokeWidth={12} strokeLinecap="round" />
      <rect x={-44} y={-14} width={88} height={74} rx={12} fill={color} stroke="#1A1230" strokeWidth={6} />
      <circle cx={0} cy={18} r={10} fill="#1A1230" />
      <path d="M 0 22 L 0 42" stroke="#1A1230" strokeWidth={8} strokeLinecap="round" />
    </g>
  );
};

/** A head-and-shoulders icon for the schematic, centred on the head at (x, y): a soft filled silhouette with a line
 * edge. `on` lights it in the live colour; `bubble` (0..1) floats a small thought cloud up beside it. */
export const HeadIcon: React.FC<{ x: number; y: number; t: number; s?: number; on?: number; bubble?: number }> = ({ x, y, t, s = 1, on = 0, bubble = 0 }) => {
  if (t < 0) return null;
  const pop = backOut(clamp(t / 6));
  const c = on > 0.5 ? SCH.live : SCH.line;
  const b = backOut(clamp(bubble));
  return (
    <g transform={`translate(${x} ${y}) scale(${s * pop})`} strokeLinecap="round" strokeLinejoin="round" style={on > 0.5 ? { filter: `drop-shadow(0 0 8px ${SCH.glow})` } : undefined}>
      <g fill={c} fillOpacity={0.22} stroke={c} strokeWidth={5}>
        <circle cx={0} cy={0} r={32} />
        <path d="M -56 86 Q -56 44 0 44 Q 56 44 56 86 Z" />
      </g>
      {b > 0 ? (
        <g transform={`translate(64 -70) scale(${b})`} fill={SCH.ground} stroke={c} strokeWidth={4}>
          <circle cx={-34} cy={44} r={5} />
          <path d="M -26 8 Q -34 -12 -14 -16 Q -8 -32 10 -26 Q 28 -32 32 -14 Q 46 -6 34 10 Q 30 22 12 18 Q 0 28 -12 18 Q -30 22 -26 8 Z" />
        </g>
      ) : null}
    </g>
  );
};
