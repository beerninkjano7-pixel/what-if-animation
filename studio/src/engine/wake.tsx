import React from 'react';
import { clamp, easeOut, rnd } from './anim';
import { FONT } from './fonts';
import { SCH } from './sets/schematic';

// Props from the never-tired run: things a sleepless week fills up with (a guitar, juggling balls, a cardboard
// rocket, a podcast mic, a toaster, cereal and milk), the night outside (a fox, a traffic light), the coat that
// looks like a person, and line icons for the schematic (a brain, a rat, a closed eye, a yawn). Same style as
// props.tsx: flat fills, a darker side away from the light, a contact shadow.

const INK = '#1A1230';

/** An acoustic guitar seen from the front, lying across a lap: body centre at (x, y), neck along `rot`. */
export const Guitar: React.FC<{ x: number; y: number; s?: number; rot?: number; strum?: number }> = ({ x, y, s = 1, rot = -20, strum = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} strokeLinejoin="round">
    <rect x={60} y={-12} width={230} height={24} rx={4} fill="#5A3A26" stroke={INK} strokeWidth={4} />
    {[0, 1, 2, 3, 4].map((i) => (
      <path key={i} d={`M ${90 + i * 40} -12 L ${90 + i * 40} 12`} stroke="#C9B48A" strokeWidth={2} />
    ))}
    <path d="M 286 -18 L 330 -22 L 334 22 L 286 18 Z" fill="#3A2618" stroke={INK} strokeWidth={4} />
    <path d="M -110 0 C -110 -70 -50 -78 -20 -50 C 0 -66 50 -70 70 -30 C 82 -10 82 10 70 30 C 50 70 0 66 -20 50 C -50 78 -110 70 -110 0 Z" fill="#D9934A" stroke={INK} strokeWidth={5} />
    <path d="M -110 0 C -110 -70 -50 -78 -20 -50 C 0 -66 50 -70 70 -30" fill="none" stroke="#FFD9A0" strokeWidth={4} opacity={0.5} />
    <circle cx={0} cy={0} r={24} fill="#2A1A12" stroke={INK} strokeWidth={4} />
    <rect x={-80} y={-16} width={20} height={32} rx={4} fill="#3A2618" />
    {[-8, -3, 3, 8].map((dy, i) => (
      <path key={i} d={`M -70 ${dy} Q 100 ${dy + Math.sin(strum * 3 + i) * 3 * strum} 330 ${dy * 0.6}`} stroke="#F6EFE3" strokeWidth={1.6} fill="none" opacity={0.8} />
    ))}
  </g>
);

/** A fox trotting, side view, facing right; feet at (x, y). `phase` drives the trot. */
export const Fox: React.FC<{ x: number; y: number; s?: number; phase?: number; facing?: 1 | -1 }> = ({ x, y, s = 1, phase = 0, facing = 1 }) => {
  const leg = (i: number) => Math.sin(phase + (i % 2 ? Math.PI : 0) + (i > 1 ? 0.6 : 0)) * 14;
  const bob = Math.abs(Math.sin(phase)) * 4;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * facing} ${s})`} strokeLinejoin="round" strokeLinecap="round">
      <ellipse cx={0} cy={2} rx={90} ry={10} fill="#000" opacity={0.3} />
      {[-50, -34, 40, 56].map((lx, i) => (
        <path key={i} d={`M ${lx} ${-62 - bob} L ${lx + leg(i)} -4`} stroke={i % 2 ? '#3A1A10' : '#4A2414'} strokeWidth={10} />
      ))}
      <g transform={`translate(0 ${-bob})`}>
        <path d={`M -70 -80 Q -130 -${96 + Math.sin(phase * 0.5) * 8} -150 -60 Q -120 -70 -70 -66 Z`} fill="#C8582A" stroke={INK} strokeWidth={4} />
        <path d="M -150 -60 Q -140 -70 -128 -66 Q -138 -56 -150 -60 Z" fill="#F6EFE3" />
        <path d="M -76 -96 Q 0 -110 70 -92 Q 84 -70 66 -58 Q 0 -50 -70 -60 Q -86 -78 -76 -96 Z" fill="#D8652E" stroke={INK} strokeWidth={4} />
        <path d="M -40 -62 Q 10 -56 60 -60 Q 40 -74 -30 -74 Z" fill="#F2E2CC" />
        <g transform="translate(78 -104)">
          <path d="M -18 6 L -6 -34 L 8 -6 Z M 6 0 L 22 -34 L 30 2 Z" fill="#B84A22" stroke={INK} strokeWidth={4} />
          <path d="M -24 10 Q -10 -18 22 -12 Q 52 -2 62 16 Q 40 26 6 26 Q -20 26 -24 10 Z" fill="#D8652E" stroke={INK} strokeWidth={4} />
          <path d="M 20 18 Q 44 20 62 16 Q 40 30 18 28 Z" fill="#F2E2CC" />
          <circle cx={62} cy={15} r={5} fill={INK} />
          <circle cx={18} cy={4} r={4} fill={INK} />
          <circle cx={19} cy={3} r={1.4} fill="#FFFFFF" />
        </g>
      </g>
    </g>
  );
};

/** A traffic light on a pole; `state` 0 red, 1 amber, 2 green. Base of the pole at (x, y). */
export const TrafficLight: React.FC<{ x: number; y: number; s?: number; state: number; t?: number }> = ({ x, y, s = 1, state }) => {
  const cols = ['#FF3A3A', '#FFB02A', '#3AE07A'];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-8} y={-520} width={16} height={520} fill="#2A2834" />
      <rect x={-46} y={-680} width={92} height={240} rx={14} fill="#1E1C26" stroke={INK} strokeWidth={5} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx={0} cy={-640 + i * 76} r={28} fill={state === i ? cols[i] : '#2E2A36'} />
          {state === i ? <circle cx={0} cy={-640 + i * 76} r={110} fill={cols[i]} opacity={0.18} style={{ mixBlendMode: 'screen' }} /> : null}
        </g>
      ))}
    </g>
  );
};

/** A bowl of cereal from three-quarters above, centre of the rim at (x, y); `milk` 0..1.3 fills it and, past 1, spills. */
export const CerealBowl: React.FC<{ x: number; y: number; s?: number; milk?: number }> = ({ x, y, s = 1, milk = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} strokeLinejoin="round">
    {milk > 1 ? <path d={`M -150 40 Q -${200 + 400 * (milk - 1)} ${120 + 200 * (milk - 1)} 20 ${110 + 260 * (milk - 1)} Q ${260 + 500 * (milk - 1)} ${120 + 200 * (milk - 1)} 150 40 Z`} fill="#F4F2EA" opacity={0.95} /> : null}
    <ellipse cx={8} cy={70} rx={150} ry={30} fill="#000" opacity={0.3} />
    <path d="M -150 0 Q -140 90 0 96 Q 140 90 150 0 Z" fill="#5A8AC8" stroke={INK} strokeWidth={5} />
    <path d="M 70 10 Q 120 60 140 4 Z" fill="#000" opacity={0.15} />
    <ellipse cx={0} cy={0} rx={150} ry={40} fill="#3E6AA0" stroke={INK} strokeWidth={5} />
    <ellipse cx={0} cy={6} rx={134} ry={32} fill={milk > 0.2 ? '#F4F2EA' : '#2E4E80'} />
    {Array.from({ length: 16 }).map((_, i) => (
      <circle key={i} cx={-110 + (i * 53) % 220} cy={-14 + ((i * 29) % 36) - milk * 6} r={12} fill="#E0A050" stroke="#8A5A2A" strokeWidth={3} />
    ))}
  </g>
);

/** A milk carton tilted to pour, its spout at (x, y); `pour` 0..1 shows the stream down to `to` y. */
export const MilkCarton: React.FC<{ x: number; y: number; s?: number; pour?: number; to?: number }> = ({ x, y, s = 1, pour = 0, to = 300 }) => (
  <g>
    {pour > 0 ? <path d={`M ${x} ${y} Q ${x + 10} ${(y + to) / 2} ${x + 6} ${to}`} stroke="#F4F2EA" strokeWidth={18 * s} fill="none" strokeLinecap="round" opacity={0.95} /> : null}
    <g transform={`translate(${x} ${y}) rotate(-120) scale(${s})`} strokeLinejoin="round">
      <rect x={-60} y={10} width={120} height={200} fill="#F4F2EA" stroke={INK} strokeWidth={5} />
      <path d="M -60 10 L 0 -40 L 60 10 Z" fill="#E4E0D4" stroke={INK} strokeWidth={5} />
      <rect x={-60} y={80} width={120} height={60} fill="#5A8AC8" />
      <rect x={-10} y={-56} width={20} height={20} fill="#E4E0D4" stroke={INK} strokeWidth={4} />
    </g>
  </g>
);

/** A toaster, side-on, base centre at (x, y); `pop` 0..1 lifts the toast out. */
export const Toaster: React.FC<{ x: number; y: number; s?: number; pop?: number }> = ({ x, y, s = 1, pop = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} strokeLinejoin="round">
    <ellipse cx={8} cy={2} rx={150} ry={14} fill="#000" opacity={0.3} />
    {[-40, 40].map((dx, i) => (
      <rect key={i} x={dx - 34} y={-190 - 90 * pop} width={68} height={90} rx={14} fill="#D9A05A" stroke={INK} strokeWidth={5} />
    ))}
    <rect x={-130} y={-170} width={260} height={170} rx={50} fill="#B8C0CC" stroke={INK} strokeWidth={6} />
    <rect x={-110} y={-160} width={60} height={140} rx={30} fill="#FFFFFF" opacity={0.35} />
    <rect x={120} y={-110} width={30} height={24} rx={6} fill="#2A2834" />
    <circle cx={60} cy={-50} r={12} fill="#2A2834" />
  </g>
);

/** A cardboard rocket built from boxes and a tube, base at (x, y), about 420 s tall. */
export const CardboardRocket: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} strokeLinejoin="round">
    <ellipse cx={8} cy={2} rx={110} ry={14} fill="#000" opacity={0.3} />
    <path d="M -60 -60 L -110 0 L -40 0 Z M 60 -60 L 110 0 L 40 0 Z" fill="#B88A5A" stroke={INK} strokeWidth={5} />
    <rect x={-60} y={-320} width={120} height={320} fill="#C89A68" stroke={INK} strokeWidth={5} />
    <path d="M -60 -320 L 0 -420 L 60 -320 Z" fill="#D4A874" stroke={INK} strokeWidth={5} />
    <circle cx={0} cy={-230} r={30} fill="#7FD4FF" stroke={INK} strokeWidth={5} />
    <path d="M -60 -150 L 60 -150 M -60 -100 L 60 -100" stroke="#8A6A44" strokeWidth={4} />
    <path d="M 20 -300 L 20 -10" stroke="#A07A50" strokeWidth={4} />
    <rect x={-50} y={-90} width={100} height={20} fill="#C0392B" opacity={0.8} />
  </g>
);

/** A podcast microphone on a desk stand, base at (x, y). */
export const PodMic: React.FC<{ x: number; y: number; s?: number; live?: number }> = ({ x, y, s = 1, live = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} strokeLinejoin="round">
    <ellipse cx={0} cy={0} rx={70} ry={12} fill="#1E1C26" />
    <path d="M 0 0 L 0 -120 L 40 -200" stroke="#3A3846" strokeWidth={10} fill="none" />
    <rect x={14} y={-300} width={64} height={120} rx={32} fill="#2A2834" stroke={INK} strokeWidth={5} transform="rotate(20 46 -240)" />
    {[0, 1, 2, 3].map((i) => (
      <path key={i} d={`M ${26 + i * 2} ${-280 + i * 22} l 40 14`} stroke="#4A4856" strokeWidth={3} transform="rotate(20 46 -240)" />
    ))}
    {live > 0 ? <circle cx={-40} cy={-30} r={10} fill="#FF3A3A" opacity={live} /> : null}
  </g>
);

/** A coat hanging on a hook on the back of a door, the hook at (x, y). `person` 0..1 morphs its outline toward a figure. */
export const HungCoat: React.FC<{ x: number; y: number; s?: number; person?: number }> = ({ x, y, s = 1, person = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} strokeLinejoin="round">
    <circle cx={0} cy={0} r={8} fill="#8A8EA6" />
    {person > 0 ? <circle cx={0} cy={-10 - 30 * person} r={40 * person} fill="#14121C" /> : null}
    <path d={`M 0 4 Q -40 10 -${70 + 10 * person} 60 L -${80 + 10 * person} 330 Q 0 ${350 + 40 * person} ${80 + 10 * person} 330 L ${70 + 10 * person} 60 Q 40 10 0 4 Z`} fill="#3A3448" stroke={INK} strokeWidth={5} />
    <path d="M -70 60 L -110 250 L -84 260 L -60 120 M 70 60 L 110 250 L 84 260 L 60 120" fill="#342E42" stroke={INK} strokeWidth={4} />
    <path d="M 0 30 L 0 330" stroke="#2A2436" strokeWidth={4} />
    <path d="M -30 10 L 0 60 L 30 10" fill="none" stroke="#2A2436" strokeWidth={5} />
  </g>
);

/** A card with one word on it, seen from above, centre (x, y). `flip` 0 face down, 1 face up. */
export const WordCard: React.FC<{ x: number; y: number; w?: number; rot?: number; flip?: number; word: string }> = ({ x, y, w = 420, rot = 0, flip = 1, word }) => {
  const h = w * 0.6;
  const sx = Math.abs(Math.cos(flip * Math.PI));
  const up = flip > 0.5;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-w / 2 + 12} y={-h / 2 + 16} width={w} height={h} rx={14} fill="#000" opacity={0.35} />
      <g transform={`scale(${Math.max(0.02, sx)} 1)`}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={14} fill={up ? '#F4EEE0' : '#1E1C2A'} stroke={INK} strokeWidth={5} />
        {up ? (
          <text x={0} y={h * 0.16} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={h * 0.5} fill="#1A1230">
            {word}
          </text>
        ) : (
          <rect x={-w / 2 + 24} y={-h / 2 + 24} width={w - 48} height={h - 48} rx={8} fill="none" stroke="#3A3650" strokeWidth={4} />
        )}
      </g>
    </g>
  );
};

/** Schematic line icons (in SCH colours), centred on (x, y), about 2s tall. */
export const SchIcon: React.FC<{ x: number; y: number; kind: 'brain' | 'rat' | 'eye' | 'yawn' | 'lids' | 'zzz' | 'clock' | 'car' | 'cup' | 'trophy' | 'book'; s?: number; t?: number; color?: string; open?: number }> = ({
  x, y, kind, s = 80, t = 10, color = SCH.line, open = 1,
}) => {
  if (t < 0) return null;
  const k = (s / 80) * easeOut(clamp(t / 6));
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
      {kind === 'brain' ? (
        <g>
          <path d="M -6 -66 Q -50 -76 -66 -40 Q -92 -30 -82 4 Q -96 34 -64 50 Q -54 76 -18 66 Q -6 74 -6 60 Z" />
          <path d="M 6 -66 Q 50 -76 66 -40 Q 92 -30 82 4 Q 96 34 64 50 Q 54 76 18 66 Q 6 74 6 60 Z" />
          <path d="M -60 -20 Q -36 -30 -30 -6 M -60 24 Q -36 14 -26 34 M 60 -20 Q 36 -30 30 -6 M 60 24 Q 36 14 26 34" />
        </g>
      ) : null}
      {kind === 'rat' ? (
        <g>
          <path d="M -70 30 Q -70 -30 0 -36 Q 50 -38 70 0 Q 80 20 60 30 Z" />
          <circle cx={48} cy={-44} r={16} />
          <circle cx={58} cy={-6} r={4} fill={color} stroke="none" />
          <path d="M 80 8 L 100 4 M 80 14 L 100 18" strokeWidth={3} />
          <path d="M -70 26 Q -110 30 -120 -10" />
          <path d="M -40 30 L -44 46 M 30 30 L 34 46" />
          {open > 0.5 ? <circle cx={58} cy={-6} r={11} /> : null}
        </g>
      ) : null}
      {kind === 'eye' ? (
        <g>
          <path d="M -80 0 Q 0 -60 80 0 Q 0 60 -80 0 Z" />
          {open > 0.5 ? <circle cx={0} cy={0} r={24} fill={color} stroke="none" /> : <path d="M -80 0 Q 0 40 80 0" />}
        </g>
      ) : null}
      {kind === 'yawn' ? (
        <g>
          <circle cx={0} cy={0} r={70} />
          <path d="M -40 -20 Q -26 -12 -12 -20 M 12 -20 Q 26 -12 40 -20" />
          <ellipse cx={0} cy={30} rx={20} ry={26} />
        </g>
      ) : null}
      {kind === 'lids' ? (
        <g>
          <path d="M -80 0 Q 0 -60 80 0 Q 0 60 -80 0 Z" />
          <path d="M -80 0 Q 0 -30 80 0" />
          <path d="M -66 -2 Q 0 -24 66 -2 L 66 6 Q 0 -10 -66 6 Z" fill={color} />
          <circle cx={0} cy={12} r={14} fill={color} stroke="none" />
        </g>
      ) : null}
      {kind === 'zzz' ? (
        <g strokeWidth={7}>
          <path d="M -60 10 L -10 10 L -60 60 L -10 60" />
          <path d="M 4 -30 L 40 -30 L 4 6 L 40 6" />
          <path d="M 50 -66 L 74 -66 L 50 -42 L 74 -42" />
        </g>
      ) : null}
      {kind === 'clock' ? (
        <g>
          <circle cx={0} cy={0} r={70} />
          <path d="M 0 0 L 0 -46 M 0 0 L 32 18" />
        </g>
      ) : null}
      {kind === 'car' ? (
        <g>
          <path d="M -90 20 L -80 -10 Q -60 -40 -20 -42 L 30 -42 Q 60 -40 76 -10 L 90 20 Z" />
          <circle cx={-50} cy={28} r={16} />
          <circle cx={50} cy={28} r={16} />
        </g>
      ) : null}
      {kind === 'cup' ? (
        <g>
          <path d="M -40 -50 L 40 -50 L 30 50 L -30 50 Z" />
          <path d="M -36 -10 L 36 -10" />
        </g>
      ) : null}
      {kind === 'trophy' ? (
        <g>
          <path d="M -40 -60 L 40 -60 Q 40 10 0 20 Q -40 10 -40 -60 Z" />
          <path d="M -40 -46 Q -76 -46 -66 -16 Q -60 0 -36 -6 M 40 -46 Q 76 -46 66 -16 Q 60 0 36 -6" />
          <path d="M 0 20 L 0 46 M -30 60 L 30 60 L 24 46 L -24 46 Z" />
        </g>
      ) : null}
      {kind === 'book' ? (
        <g>
          <path d="M -80 -50 Q -40 -64 0 -46 Q 40 -64 80 -50 L 80 56 Q 40 42 0 60 Q -40 42 -80 56 Z" />
          <path d="M 0 -46 L 0 60" />
        </g>
      ) : null}
    </g>
  );
};

/** Juggling balls in a cascade above a pair of hands at (x, y): three balls on figure-eight arcs. */
export const JuggleBalls: React.FC<{ x: number; y: number; t: number; s?: number }> = ({ x, y, t, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {['#E4505E', '#FFD65A', '#5AB8E8'].map((c, i) => {
      const ph = ((t / 14 + i / 3) % 1) * Math.PI * 2;
      const bx = Math.cos(ph) * 70;
      const by = -Math.abs(Math.sin(ph)) * 170;
      return <circle key={i} cx={bx} cy={by} r={22} fill={c} stroke={INK} strokeWidth={4} />;
    })}
  </g>
);

/** Dust motes in the dark that drift on their own (`seed` scatters them). */
export const Motes: React.FC<{ t: number; seed: number; n?: number; o?: number }> = ({ t, seed, n = 30, o = 0.5 }) => (
  <g>
    {Array.from({ length: n }).map((_, i) => (
      <circle key={i} cx={(rnd(seed, i) * 1920 + t * (0.5 + rnd(seed, i + 50))) % 1920} cy={(rnd(seed + 1, i) * 1080 - t * 0.3 + 1080) % 1080} r={1.5 + rnd(seed + 2, i) * 2.5} fill="#FFE7C0" opacity={o * (0.4 + 0.6 * rnd(seed + 3, i))} />
    ))}
  </g>
);
