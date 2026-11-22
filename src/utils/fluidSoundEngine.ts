/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Native Web Audio Fluid Droplet & Splash Sound Engine
 * Zero external audio files, zero CDN dependencies, 100% instant offline response.
 * Mimics organic water droplet ripples, citrus juice splashes, and fresh fruit peeling.
 */

class FluidSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    try {
      const saved = localStorage.getItem('tazamandi_fluid_sound_enabled');
      if (saved !== null) {
        this.isMuted = saved === 'false';
      }
    } catch {}
  }

  private initCtx(): AudioContext | null {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    } catch {}
    return this.ctx;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('tazamandi_fluid_sound_enabled', String(!this.isMuted));
    } catch {}
    if (!this.isMuted) {
      this.playDropletSound(1.2);
    }
    return !this.isMuted;
  }

  /**
   * Water / Nectar Droplet Ripple Sound
   * Rapid upward frequency sweep mimicking a water droplet falling into fluid
   */
  public playDropletSound(pitchMultiplier = 1.0) {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Droplet frequency sweep from base upwards
      const baseFreq = 520 * pitchMultiplier;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.1, now + 0.08);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {}
  }

  /**
   * Fruit Juice Squeeze & Bubble Splash Sound
   */
  public playJuiceSqueezeSound() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Multi-bubble splash
      [0, 0.04, 0.08].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        const startFreq = (380 + idx * 140);
        osc.frequency.setValueAtTime(startFreq, now + offset);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 1.6, now + offset + 0.07);

        gain.gain.setValueAtTime(0.12 / (idx + 1), now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.1);
      });
    } catch {}
  }

  /**
   * Fresh Fruit Peel Sound (Soft organic sliding friction)
   */
  public playPeelSound() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.22);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);
      filter.frequency.linearRampToValueAtTime(650, now + 0.12);
      filter.frequency.linearRampToValueAtTime(200, now + 0.22);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.24);
    } catch {}
  }

  /**
   * Add-To-Cart Splash Chime: Combination of water splash and harmonic ding
   */
  public playAddToCartSplashSound() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Droplet splash
      this.playDropletSound(1.3);

      // Sweet harmonic bell chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now + 0.05); // A5
      osc.frequency.setValueAtTime(1318.51, now + 0.12); // E6

      gain.gain.setValueAtTime(0.15, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + 0.05);
      osc.stop(now + 0.46);
    } catch {}
  }
}

export const fluidSoundEngine = new FluidSoundEngine();
