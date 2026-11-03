// Synthesized sound effects — Web Audio, no audio files. Keys are game
// events, so swapping a sound only touches its recipe. Each note is a pitch
// sweep (or, with `noise`, a band-passed noise burst) under a quick attack
// and exponential decay. Muting persists per browser in localStorage.

export type Sfx = "invest" | "exit" | "bad" | "info" | "up" | "down" | "advance" | "deal" | "finale" | "gameover";

type Note = {
  at?: number; // seconds after play()
  freq: number; // pitch, or the band-pass centre for noise
  to?: number; // sweep target
  dur: number;
  type?: OscillatorType;
  gain: number;
  noise?: boolean;
};

const SOUNDS: Record<Sfx, Note[]> = {
  // arcade coin
  invest: [
    { freq: 988, dur: 0.08, type: "square", gain: 0.08 },
    { at: 0.07, freq: 1319, dur: 0.22, type: "square", gain: 0.08 },
  ],
  // fanfare: C–E–G, then a held high C
  exit: [
    { freq: 523, dur: 0.12, type: "triangle", gain: 0.16 },
    { at: 0.1, freq: 659, dur: 0.12, type: "triangle", gain: 0.16 },
    { at: 0.2, freq: 784, dur: 0.12, type: "triangle", gain: 0.16 },
    { at: 0.3, freq: 1047, dur: 0.6, type: "triangle", gain: 0.18 },
  ],
  // sad trombone
  bad: [
    { freq: 233, dur: 0.25, type: "sawtooth", gain: 0.05 },
    { at: 0.25, freq: 220, dur: 0.25, type: "sawtooth", gain: 0.05 },
    { at: 0.5, freq: 208, to: 150, dur: 0.7, type: "sawtooth", gain: 0.05 },
  ],
  // soft tone
  info: [{ freq: 440, dur: 0.15, type: "sine", gain: 0.15 }],
  // two-note rise
  up: [
    { freq: 523, dur: 0.08, type: "triangle", gain: 0.14 },
    { at: 0.08, freq: 784, dur: 0.14, type: "triangle", gain: 0.14 },
  ],
  // slide down
  down: [{ freq: 600, to: 280, dur: 0.3, type: "triangle", gain: 0.15 }],
  // synth sweep
  advance: [{ freq: 200, to: 900, dur: 0.25, type: "sawtooth", gain: 0.04 }],
  // card snap
  deal: [{ freq: 5000, dur: 0.03, gain: 0.3, noise: true }],
  // fund closed: G–C–E pickup, then a held C-major chord over a low thump
  finale: [
    { freq: 392, dur: 0.1, type: "triangle", gain: 0.12 },
    { at: 0.1, freq: 523, dur: 0.1, type: "triangle", gain: 0.12 },
    { at: 0.2, freq: 659, dur: 0.1, type: "triangle", gain: 0.12 },
    { at: 0.32, freq: 120, to: 50, dur: 0.3, type: "sine", gain: 0.3 },
    { at: 0.32, freq: 523, dur: 1.4, type: "triangle", gain: 0.1 },
    { at: 0.32, freq: 659, dur: 1.4, type: "triangle", gain: 0.08 },
    { at: 0.32, freq: 784, dur: 1.4, type: "triangle", gain: 0.08 },
    { at: 0.32, freq: 1047, dur: 1.4, type: "square", gain: 0.03 },
  ],
  // fund closed as a Ghost: chiptune run falling G5 → C4
  gameover: [784, 659, 523, 392, 330, 262].map((freq, i) => ({
    at: i * 0.1,
    freq,
    dur: i === 5 ? 0.6 : 0.12,
    type: "square" as const,
    gain: 0.05,
  })),
};

const MUTE_KEY = "fundsim:muted";
const listeners = new Set<() => void>();
let ctx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {}
  for (const l of listeners) l();
}

export function subscribeMuted(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function play(sfx: Sfx, delaySeconds = 0) {
  if (typeof window === "undefined" || isMuted()) return;
  // Before the first click the browser keeps audio suspended, and anything
  // scheduled would burst out all at once on that click — so skip instead.
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  const t0 = ctx.currentTime + delaySeconds;
  for (const n of SOUNDS[sfx]) {
    const start = t0 + (n.at ?? 0);
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(n.gain, start + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + n.dur);
    amp.connect(ctx.destination);

    let src: AudioScheduledSourceNode;
    if (n.noise) {
      if (!noiseBuffer) {
        noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); // 1s of white noise
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.setValueAtTime(n.freq, start);
      if (n.to) band.frequency.exponentialRampToValueAtTime(n.to, start + n.dur);
      noise.connect(band).connect(amp);
      src = noise;
    } else {
      const osc = ctx.createOscillator();
      osc.type = n.type ?? "sine";
      osc.frequency.setValueAtTime(n.freq, start);
      if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, start + n.dur);
      osc.connect(amp);
      src = osc;
    }
    src.start(start);
    src.stop(start + n.dur + 0.02);
  }
}
