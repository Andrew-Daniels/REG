import { describe, it, expect } from 'vitest';
import { noteToFreq, buildThemeLoop, sequenceDuration } from '../src/audio/notes';

describe('noteToFreq', () => {
  it('maps A4 to 440Hz', () => {
    expect(noteToFreq('A4')).toBeCloseTo(440, 1);
  });
  it('maps A5 one octave up to 880Hz', () => {
    expect(noteToFreq('A5')).toBeCloseTo(880, 1);
  });
  it('handles sharps (C#5 above C5)', () => {
    expect(noteToFreq('C#5')).toBeGreaterThan(noteToFreq('C5'));
  });
  it('treats a rest as 0Hz', () => {
    expect(noteToFreq('rest')).toBe(0);
  });
});

describe('buildThemeLoop', () => {
  it('produces a non-empty note sequence', () => {
    const seq = buildThemeLoop();
    expect(seq.length).toBeGreaterThan(8);
    for (const n of seq) {
      expect(n.freq).toBeGreaterThanOrEqual(0);
      expect(n.duration).toBeGreaterThan(0);
    }
  });

  it('loops cleanly to a whole number of beats', () => {
    const seq = buildThemeLoop();
    const beats = sequenceDuration(seq) / 0.5; // 120bpm eighth-note grid
    expect(Math.abs(beats - Math.round(beats))).toBeLessThan(1e-9);
  });
});
