/** Pure music helpers: note→frequency and the theme-loop sequence. */

const SEMITONES: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
  'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

/** Convert a note like "A4", "C#5", or "rest" to a frequency in Hz. */
export function noteToFreq(note: string): number {
  if (note === 'rest') return 0;
  const m = /^([A-G][#b]?)(-?\d)$/.exec(note);
  if (!m) throw new Error(`Bad note: ${note}`);
  const semis = SEMITONES[m[1]];
  const octave = parseInt(m[2], 10);
  // MIDI note number; A4 (440Hz) is MIDI 69.
  const midi = semis + (octave + 1) * 12;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export interface ThemeNote {
  freq: number;
  duration: number;
}

const EIGHTH = 0.5; // seconds at 120bpm

/**
 * A jaunty, public-domain-safe "think music" loop reminiscent of a TV game-show
 * countdown — written from scratch, not a copy of any copyrighted theme.
 */
const THEME: Array<[string, number]> = [
  ['G4', 2], ['C5', 2], ['G4', 2], ['E4', 2],
  ['G4', 2], ['C5', 2], ['E5', 2], ['C5', 2],
  ['D5', 2], ['G4', 2], ['D5', 2], ['B4', 2],
  ['D5', 2], ['G5', 2], ['F5', 2], ['rest', 2],
];

export function buildThemeLoop(): ThemeNote[] {
  return THEME.map(([note, eighths]) => ({
    freq: noteToFreq(note),
    duration: eighths * EIGHTH,
  }));
}

export function sequenceDuration(seq: ThemeNote[]): number {
  return seq.reduce((s, n) => s + n.duration, 0);
}
