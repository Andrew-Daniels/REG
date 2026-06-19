/** Web Audio sound engine: synthesized theme, ticking timer, and SFX. */

import { buildThemeLoop } from './notes';
import type { ScoreTierName } from '../core/scoring';

type Ctx = AudioContext;

export class SoundEngine {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private themeTimer: ReturnType<typeof setTimeout> | null = null;
  private muted = false;

  /** Lazily create the context (must be after a user gesture on mobile). */
  private ensure(): Ctx | null {
    if (typeof window === 'undefined') return null;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!this.ctx) {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
  }

  isMuted() {
    return this.muted;
  }

  private tone(freq: number, start: number, dur: number, type: OscillatorType, gain = 0.3) {
    const ctx = this.ctx;
    if (!ctx || !this.master || freq <= 0) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  /** Start the looping theme song. */
  startTheme() {
    const ctx = this.ensure();
    if (!ctx) return;
    const seq = buildThemeLoop();
    const total = seq.reduce((s, n) => s + n.duration, 0);
    const playOnce = () => {
      if (!this.ctx) return;
      let t = this.ctx.currentTime + 0.05;
      for (const n of seq) {
        this.tone(n.freq, t, n.duration * 0.9, 'triangle', 0.18);
        t += n.duration;
      }
    };
    this.stopTheme();
    playOnce();
    this.themeTimer = setInterval(playOnce, total * 1000);
  }

  stopTheme() {
    if (this.themeTimer) {
      clearInterval(this.themeTimer);
      this.themeTimer = null;
    }
  }

  /** A single clock tick (call once per second while the round timer runs). */
  tick(urgent = false) {
    const ctx = this.ensure();
    if (!ctx) return;
    this.tone(urgent ? 1200 : 900, ctx.currentTime, 0.06, 'square', 0.12);
  }

  click() {
    const ctx = this.ensure();
    if (!ctx) return;
    this.tone(660, ctx.currentTime, 0.05, 'sine', 0.15);
  }

  playerJoined() {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.tone(523, t, 0.1, 'sine', 0.2);
    this.tone(784, t + 0.1, 0.15, 'sine', 0.2);
  }

  /** Celebration / reaction sound matched to a golf result tier. */
  celebrate(tier: ScoreTierName) {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    switch (tier) {
      case 'ace':
        [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, t + i * 0.1, 0.25, 'triangle', 0.25));
        break;
      case 'eagle':
        [523, 784, 1047].forEach((f, i) => this.tone(f, t + i * 0.1, 0.2, 'triangle', 0.22));
        break;
      case 'birdie':
        [659, 988].forEach((f, i) => this.tone(f, t + i * 0.08, 0.18, 'sine', 0.22));
        break;
      case 'par':
        this.tone(660, t, 0.2, 'sine', 0.2);
        break;
      case 'bogey':
        this.tone(330, t, 0.25, 'sawtooth', 0.18);
        break;
      case 'double_bogey':
      case 'triple_bogey':
        this.tone(220, t, 0.3, 'sawtooth', 0.2);
        this.tone(207, t + 0.15, 0.3, 'sawtooth', 0.2);
        break;
      case 'out_of_bounds':
        this.tone(160, t, 0.5, 'sawtooth', 0.22);
        break;
    }
  }
}

/** Shared singleton for the app. */
export const sound = new SoundEngine();
